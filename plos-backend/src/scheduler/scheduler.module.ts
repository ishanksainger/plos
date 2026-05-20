import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
