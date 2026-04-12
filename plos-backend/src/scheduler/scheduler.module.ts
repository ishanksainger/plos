import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule], // 👈 THIS IS THE FIX
  providers: [SchedulerService, PrismaService],
})
export class SchedulerModule {}
