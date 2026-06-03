import { Global, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { WhatsappService } from './whatsapp.service';

@Global()
@Module({
  /** `NotificationController` uses `JwtAuthGuard` → needs `JwtService` from `JwtModule`. */
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, WhatsappService],
  exports: [NotificationService, WhatsappService],
})
export class NotificationModule {}
