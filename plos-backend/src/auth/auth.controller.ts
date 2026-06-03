import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './current-user.decorator';

interface ForgotPasswordDto {
  email?: string;
}
interface ResetPasswordDto {
  token?: string;
  password?: string;
}
interface VerifyEmailDto {
  token?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Tight: 5 register attempts per minute per IP — covers honest typos but
  // stops sign-up bots from spamming the persons table + outbound email.
  @Throttle({ long: { ttl: 60_000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Tight: 10 login attempts per minute. Brute force + credential stuffing.
  @Throttle({ long: { ttl: 60_000, limit: 10 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Request a password reset email. Always returns ok — we never reveal
   * whether the email is registered (account-enumeration defence).
   */
  @Throttle({ long: { ttl: 60_000, limit: 5 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto?.email ?? '');
    return { ok: true };
  }

  /** Consume a reset token, rotate the password. */
  @Throttle({ long: { ttl: 60_000, limit: 10 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto?.token ?? '',
      dto?.password ?? '',
    );
  }

  /** Re-send the verification email for the currently logged-in user. */
  @Throttle({ long: { ttl: 60_000, limit: 5 } })
  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  async resendVerification(@CurrentUser() user: JwtPayload) {
    await this.authService.sendEmailVerification(user.sub);
    return { ok: true };
  }

  /** Consume the verification token (link target in the email). */
  @Throttle({ long: { ttl: 60_000, limit: 30 } })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto?.token ?? '');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  patchMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.sub, dto);
  }

  /** Permanently deletes the current user + every record they own. DPDP §11. */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.authService.deleteAccount(user.sub);
  }
}
