import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/health')
  health() {
    return {
      status: 'ok',
      service: 'plos-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
