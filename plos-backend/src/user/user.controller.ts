import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { TodayService } from './today.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly todayService: TodayService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.userService.getDashboard(user.sub);
  }

  /** Today home: overdue, due today, upcoming 7d, diary feed inputs (timezone-aware). */
  @Get('today')
  @UseGuards(JwtAuthGuard)
  getToday(@CurrentUser() user: JwtPayload, @Query('tz') tz?: string) {
    return this.todayService.getToday(user.sub, tz);
  }
}
