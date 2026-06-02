import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

/**
 * Step K — tracker CSV import. PrismaService + PlanService come from their
 * global modules, so no imports needed here.
 */
@Module({
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
