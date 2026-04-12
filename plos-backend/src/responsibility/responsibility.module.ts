import { Module } from '@nestjs/common';
import { ResponsibilityController } from './responsibility.controller';
import { ResponsibilityService } from './responsibility.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule],
  controllers: [ResponsibilityController],
  providers: [ResponsibilityService, PrismaService],
})
export class ResponsibilityModule {}
