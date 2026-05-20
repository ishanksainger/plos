import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponsibilityController } from './responsibility.controller';
import { ResponsibilityService } from './responsibility.service';

describe('ResponsibilityController', () => {
  let controller: ResponsibilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResponsibilityController],
      providers: [
        {
          provide: ResponsibilityService,
          useValue: {
            create: jest.fn(),
            markComplete: jest.fn(),
            update: jest.fn(),
            getByUser: jest.fn(),
            getById: jest.fn(),
            delete: jest.fn(),
            getStateSummaryByUser: jest.fn(),
            getTimeline: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ResponsibilityController>(ResponsibilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
