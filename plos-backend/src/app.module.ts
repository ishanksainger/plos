import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResponsibilityModule } from './responsibility/responsibility.module';
import { UserModule } from './user/user.module';
import { PersonModule } from './person/person.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { EventModule } from './event/event.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        ...(process.env.NODE_ENV !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: { singleLine: true, colorize: true },
              },
            }
          : {}),
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    NotificationModule,
    AuthModule,
    ResponsibilityModule,
    UserModule,
    PersonModule,
    SchedulerModule,
    EventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
