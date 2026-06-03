import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResponsibilityService } from './responsibility.service';
import { CreateResponsibilityDto } from './dto/create-responsibility.dto';
import { UpdateResponsibilityDto } from './dto/update-responsibility.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/current-user.decorator';

@Controller('responsibility')
@UseGuards(JwtAuthGuard)
export class ResponsibilityController {
  constructor(private readonly responsibilityService: ResponsibilityService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateResponsibilityDto,
  ) {
    return this.responsibilityService.create({ ...dto, userId: user.sub });
  }

  @Patch(':id/complete')
  markComplete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.responsibilityService.markComplete(Number(id), user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateResponsibilityDto,
  ) {
    return this.responsibilityService.update(Number(id), user.sub, dto);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.responsibilityService.getStateSummaryByUser(user.sub);
  }

  /** Declared before `:id` so `habits` is not captured as an id. */
  @Get('habits/streaks')
  getHabitStreaks(@CurrentUser() user: JwtPayload) {
    return this.responsibilityService.getHabitStreaks(user.sub);
  }

  /** Per-day completion history for one habit's streak chain. */
  @Get('habits/:id/history')
  getHabitHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    return this.responsibilityService.getHabitHistory(
      user.sub,
      Number(id),
      days ? Number(days) : 42,
    );
  }

  @Get()
  getByUser(
    @CurrentUser() user: JwtPayload,
    @Query('state') state?: string,
    @Query('category') category?: string,
    @Query('personId') personId?: string,
  ) {
    return this.responsibilityService.getByUser(
      user.sub,
      state,
      category,
      personId ? Number(personId) : undefined,
    );
  }

  @Get(':id')
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.responsibilityService.getById(Number(id), user.sub);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.responsibilityService.delete(Number(id), user.sub);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.responsibilityService.getTimeline(Number(id));
  }
}
