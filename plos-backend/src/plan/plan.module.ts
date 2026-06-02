import { Global, Module } from '@nestjs/common';
import { PlanService } from './plan.service';

/**
 * Global so any module (responsibility, person, scheduler, billing) can inject
 * PlanService without re-importing. PrismaModule is already @Global, so this
 * needs no imports.
 */
@Global()
@Module({
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
