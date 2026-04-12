import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponsibilityState } from 'src/responsibility/responsibility.state';

const timelineSelect = {
  fromState: true,
  toState: true,
  occurredAt: true,
} as const;

export type ResponsibilityTimelineEntry = Prisma.EventGetPayload<{
  select: typeof timelineSelect;
}>;

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async recordStateTransition(
    responsibilityId: number,
    fromState: ResponsibilityState,
    toState: ResponsibilityState,
  ) {
    const lastEvent = await this.prisma.event.findFirst({
      where: { responsibilityId },
      orderBy: { occurredAt: 'desc' },
    });

    if (lastEvent && lastEvent.toState === String(toState)) {
      return null;
    }

    return this.prisma.event.create({
      data: {
        responsibilityId,
        fromState,
        toState,
      },
    });
  }

  getTimelineByResponsibility(
    responsibilityId: number,
  ): Promise<ResponsibilityTimelineEntry[]> {
    return this.prisma.event.findMany({
      where: {
        responsibilityId,
      },
      orderBy: {
        occurredAt: 'asc',
      },
      select: timelineSelect,
    });
  }
}
