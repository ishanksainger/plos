import { Module } from '@nestjs/common';
import { ResponsibilityController } from './responsibility.controller';
import { ResponsibilityService } from './responsibility.service';
import { EventModule } from 'src/event/event.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [EventModule, AuthModule],
  controllers: [ResponsibilityController],
  providers: [ResponsibilityService],
})
export class ResponsibilityModule {}
