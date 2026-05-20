import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness + DB connectivity for deploy probes and monitoring.
   */
  @Get('/health')
  async health() {
    let dbConnected = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
    return {
      ok: dbConnected,
      dbConnected,
      status: dbConnected ? 'ok' : 'degraded',
      service: 'plos-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
