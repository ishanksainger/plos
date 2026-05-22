import {
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
