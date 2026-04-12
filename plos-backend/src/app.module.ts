import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponsibilityModule } from './responsibility/responsibility.module';
import { UserModule } from './user/user.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 🔑 THIS loads .env for the whole app
    }),
    ScheduleModule.forRoot(), // 👈 THIS LINE ENABLES CRON
    ResponsibilityModule,
    UserModule,
    SchedulerModule,
    EventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
