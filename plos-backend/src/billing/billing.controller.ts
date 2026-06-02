import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** The caller's effective plan, limits, pricing, and whether billing is live. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.billing.getStatus(user.sub);
  }

  /** Start an upgrade. Returns the founding-member notice while billing is off. */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    return this.billing.subscribe(user.sub, dto);
  }
}
