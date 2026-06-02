import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { SearchModule } from './search/search.module';
import { PlanModule } from './plan/plan.module';
import { BillingModule } from './billing/billing.module';
import { ImportModule } from './import/import.module';

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
    // Per-IP rate limiting (default guard). Auth endpoints tighten further
    // via @Throttle() overrides on the controller methods.
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1_000,  limit: 10 },  //  10 / 1s   — burst
      { name: 'medium', ttl: 10_000, limit: 30 },  //  30 / 10s  — steady
      { name: 'long',   ttl: 60_000, limit: 120 }, // 120 / 60s  — ceiling
    ]),
    PrismaModule,
    PlanModule,
    NotificationModule,
    AuthModule,
    ResponsibilityModule,
    UserModule,
    PersonModule,
    SchedulerModule,
    EventModule,
    SearchModule,
    BillingModule,
    ImportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
