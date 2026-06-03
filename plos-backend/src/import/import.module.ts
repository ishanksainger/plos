import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

/**
 * Step K — tracker CSV import. AuthModule is imported for JwtService
 * (JwtAuthGuard on the controller); PrismaService + PlanService come from
 * their global modules.
 */
@Module({
  imports: [AuthModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
