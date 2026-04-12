import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ResponsibilityService } from './responsibility.service';
import { CreateResponsibilityDto } from './dto/create-responsibility.dto';

@Controller('responsibility')
export class ResponsibilityController {
  constructor(private readonly responsibilityService: ResponsibilityService) {}

  @Post()
  create(@Body() dto: CreateResponsibilityDto) {
    return this.responsibilityService.create(dto);
  }

  @Patch(':id/complete')
  markComplete(@Param('id') id: string) {
    return this.responsibilityService.markComplete(Number(id));
  }

  @Get('summary')
  getSummary(@Query('userId') userId: string) {
    return this.responsibilityService.getStateSummaryByUser(Number(userId));
  }

  @Get()
  getByUser(
    @Query('userId') userId: string,
    @Query('state') state?: string,
    @Query('category') category?: string,
  ) {
    return this.responsibilityService.getByUser(
      Number(userId),
      state,
      category,
    );
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.responsibilityService.getById(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.responsibilityService.delete(Number(id));
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.responsibilityService.getTimeline(Number(id));
  }
}
