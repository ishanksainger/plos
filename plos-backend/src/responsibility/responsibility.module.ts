import { Module } from '@nestjs/common';
import { ResponsibilityController } from './responsibility.controller';
import { ResponsibilityService } from './responsibility.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ResponsibilityController],
  providers: [ResponsibilityService, PrismaService]
})
export class ResponsibilityModule {}
