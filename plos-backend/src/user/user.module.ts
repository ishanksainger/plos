import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TodayService } from './today.service';
import { AuthModule } from 'src/auth/auth.module';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [AuthModule, EventModule],
  providers: [UserService, TodayService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
