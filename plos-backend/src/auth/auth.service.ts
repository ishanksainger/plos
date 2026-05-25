import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';
import { normalizeAccountType, type AccountType } from './account-type';
import { normalizeOptionalPhone } from 'src/common/phone.util';
import { MailerService } from 'src/common/mailer.service';

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;        // 30 min
const EMAIL_VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailer: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const accountType = normalizeAccountType(dto.accountType);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        accountType,
      },
    });

    await this.prisma.person.create({
      data: {
        userId: user.id,
        name: dto.name ?? 'Me',
        relation: 'self',
        email: dto.email.trim().toLowerCase(),
      },
    });

    if (
      (accountType === 'family' || accountType === 'shared') &&
      dto.householdMembers?.length
    ) {
      await this.prisma.person.createMany({
        data: dto.householdMembers.map((m) => ({
          userId: user.id,
          name: m.name.trim(),
          email: m.email.trim().toLowerCase(),
          phone: normalizeOptionalPhone(m.phone),
          relation: m.relation,
        })),
      });
    }

    // Give them a free subscription
    await this.prisma.subscription.create({
      data: { userId: user.id, tier: 'free', status: 'active' },
    });

    // Fire-and-forget verification email — don't block registration on it.
    void this.sendEmailVerification(user.id);

    const token = await this.signToken(user.id, user.email);
    return {
      token,
      user: this.toAuthUserPayload(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.signToken(user.id, user.email);
    return {
      token,
      user: this.toAuthUserPayload(user),
    };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerifiedAt: true,
        timezone: true,
        currency: true,
        accountType: true,
        phone: true,
        subscription: true,
      },
    });
    if (!user) return null;
    return {
      ...user,
      accountType: normalizeAccountType(user.accountType),
    };
  }

  /**
   * Updates profile fields for the current user. Empty body is a no-op (returns `me`).
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      data.name = trimmed === '' ? null : trimmed;
    }
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.accountType !== undefined) {
      data.accountType = normalizeAccountType(dto.accountType);
    }
    if (dto.phone !== undefined) {
      data.phone = normalizeOptionalPhone(dto.phone) ?? null;
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data });
    }
    return this.me(userId);
  }

  /**
   * Step 1 of the password reset flow. Always returns void — we never tell
   * the caller whether the email exists (account-enumeration defence). If
   * the user exists, we issue a 30-minute single-use token and mail it.
   */
  async requestPasswordReset(rawEmail: string): Promise<void> {
    const email = rawEmail?.trim().toLowerCase();
    if (!email) return;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    // Invalidate any outstanding tokens so the latest mail "wins".
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    await this.mailer.sendPasswordReset({ to: user.email, token, name: user.name });
  }

  /**
   * Step 2: consume a reset token and rotate the password hash. Throws if
   * the token is unknown, expired, used, or the password is too short.
   */
  async resetPassword(token: string, newPassword: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Invalid token');
    }
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    const row = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      // Burn every other outstanding reset token while we're here.
      this.prisma.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null, id: { not: row.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  /**
   * Issues + mails a fresh email-verification token. Safe to call any
   * number of times; older unused tokens are marked used so only the
   * latest link works.
   */
  async sendEmailVerification(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerifiedAt) return;

    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('base64url');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
      },
    });

    await this.mailer.sendEmailVerification({ to: user.email, token, name: user.name });
  }

  /** Consumes a verification token and stamps User.emailVerifiedAt. */
  async verifyEmail(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Invalid token');
    }
    const row = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException('Verification link is invalid or expired');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  /**
   * Permanently deletes the user and every record they own. Used by both
   * the `DELETE /auth/me` self-service endpoint and DPDP right-of-erasure
   * requests. Runs inside one transaction so a failure halfway through
   * doesn't leave orphans.
   *
   * Order matters — children before parents to satisfy FK constraints:
   *   events (per responsibility) → notifications → responsibilities →
   *   persons → notificationPrefs → subscription → tokens → user.
   */
  async deleteAccount(userId: number): Promise<{ deleted: true }> {
    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) throw new UnauthorizedException('No such account');

    await this.prisma.$transaction(async (tx) => {
      const myResponsibilities = await tx.responsibility.findMany({
        where: { userId },
        select: { id: true },
      });
      const responsibilityIds = myResponsibilities.map((r) => r.id);

      if (responsibilityIds.length) {
        await tx.event.deleteMany({
          where: { responsibilityId: { in: responsibilityIds } },
        });
      }

      await tx.notification.deleteMany({ where: { userId } });
      await tx.responsibility.deleteMany({ where: { userId } });
      await tx.person.deleteMany({ where: { userId } });
      await tx.notificationPreferences.deleteMany({ where: { userId } });
      await tx.subscription.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.emailVerificationToken.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return { deleted: true };
  }

  private toAuthUserPayload(user: {
    id: number;
    email: string;
    name: string | null;
    timezone: string;
    currency: string;
    accountType?: string | null;
    phone?: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      currency: user.currency,
      accountType: normalizeAccountType(user.accountType) as AccountType,
      phone: user.phone ?? null,
    };
  }

  private signToken(userId: number, email: string) {
    return this.jwtService.signAsync({ sub: userId, email });
  }
}
