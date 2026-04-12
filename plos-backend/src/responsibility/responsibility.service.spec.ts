import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from 'src/event/event.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponsibilityService } from './responsibility.service';

describe('ResponsibilityService', () => {
  let service: ResponsibilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsibilityService,
        {
          provide: PrismaService,
          useValue: {
            responsibility: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: EventService,
          useValue: {
            recordStateTransition: jest.fn(),
            getTimelineByResponsibility: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResponsibilityService>(ResponsibilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
