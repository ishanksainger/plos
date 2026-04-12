import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [EventService, PrismaService],
  exports: [EventService],
})
export class EventModule {}
