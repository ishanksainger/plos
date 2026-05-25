import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TodayService } from './today.service';
import { NotificationPrefsService } from './notification-prefs.service';
import { ExportService } from './export.service';
import { AuthModule } from 'src/auth/auth.module';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [AuthModule, EventModule],
  providers: [UserService, TodayService, NotificationPrefsService, ExportService],
  controllers: [UserController],
  exports: [UserService, NotificationPrefsService],
})
export class UserModule {}
