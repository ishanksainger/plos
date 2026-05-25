import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { TodayService } from './today.service';
import {
  NotificationPrefsService,
  type UpdateNotificationPrefsDto,
} from './notification-prefs.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly todayService: TodayService,
    private readonly notificationPrefsService: NotificationPrefsService,
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

  @Get('notification-preferences')
  @UseGuards(JwtAuthGuard)
  getNotificationPreferences(@CurrentUser() user: JwtPayload) {
    return this.notificationPrefsService.getOrCreate(user.sub);
  }

  @Patch('notification-preferences')
  @UseGuards(JwtAuthGuard)
  updateNotificationPreferences(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateNotificationPrefsDto,
  ) {
    return this.notificationPrefsService.update(user.sub, body);
  }
}
