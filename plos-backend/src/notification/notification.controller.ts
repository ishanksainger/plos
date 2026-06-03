import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/current-user.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /** Register before parametric routes so `unread-count` is not parsed as an id. */
  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationService
      .unreadCount(user.sub)
      .then((count) => ({ count }));
  }

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 50;
    return this.notificationService.listForUser(
      user.sub,
      Number.isFinite(n) ? n : 50,
    );
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markRead(user.sub, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationService.markAllRead(user.sub);
  }
}
