import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/current-user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  /**
   * Returns the authenticated user's chronological event feed (newest first),
   * each entry joined with its originating responsibility.
   */
  @Get()
  getFeed(@CurrentUser() user: JwtPayload, @Query('limit') limit?: string) {
    const cap = Math.min(Math.max(Number(limit) || 100, 1), 500);
    return this.eventService.getUserFeed(user.sub, cap);
  }
}
