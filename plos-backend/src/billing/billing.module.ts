import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

/**
 * AuthModule is imported for JwtService (JwtAuthGuard on the controller).
 * PlanService comes from the global PlanModule.
 */
@Module({
  imports: [AuthModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
