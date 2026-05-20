import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return ok when database is reachable', async () => {
      const result = await appController.health();
      expect(result).toMatchObject({
        ok: true,
        dbConnected: true,
        status: 'ok',
        service: 'plos-backend',
      });
      expect(result.timestamp).toBeDefined();
    });
  });
});
