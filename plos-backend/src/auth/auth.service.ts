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
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    // Create a "Self" person for the user automatically
    await this.prisma.person.create({
      data: { userId: user.id, name: dto.name ?? 'Me', relation: 'self' },
    });

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
      select: { id: true, email: true, name: true, timezone: true, currency: true, subscription: true },
    });
    return user;
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
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      currency: user.currency,
    };
  }

  private signToken(userId: number, email: string) {
    return this.jwtService.signAsync({ sub: userId, email });
  }
}
