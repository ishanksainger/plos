import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponsibilityState } from 'src/responsibility/responsibility.state';

export type ResponsibilityTimelineEntry = {
  fromState: string;
  toState: string;
  occurredAt: Date;
  note?: string | null;
};

export type UserEventFeedEntry = {
  id: number;
  fromState: string;
  toState: string;
  occurredAt: Date;
  note?: string | null;
  responsibility: {
    id: number;
    title: string;
    category: string;
    amount: number | null;
    person: { id: number; name: string; relation: string } | null;
  };
};

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record a state transition for a responsibility.
   * By default skips if the latest event already has the same `toState` (scheduler dedupe).
   * Set `opts.force` to always insert (e.g. recurring “complete occurrence” where `toState` may repeat).
   */
  async recordStateTransition(
    responsibilityId: number,
    fromState: ResponsibilityState,
    toState: ResponsibilityState,
    opts?: { note?: string | null; force?: boolean },
  ) {
    if (!opts?.force) {
      const lastEvent = await this.prisma.event.findFirst({
        where: { responsibilityId },
        orderBy: { occurredAt: 'desc' },
      });

      if (lastEvent && lastEvent.toState === String(toState)) {
        return null;
      }
    }

    return this.prisma.event.create({
      data: {
        responsibilityId,
        fromState,
        toState,
        ...(opts?.note !== undefined && opts.note !== null
          ? { note: opts.note }
          : {}),
      },
    });
  }

  /**
   * All events for a single responsibility, oldest first.
   */
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
      select: { fromState: true, toState: true, occurredAt: true, note: true },
    });
  }

  /**
   * All events for a user, joined with the originating responsibility — the feed
   * powering the Timeline page. Newest first, paginated.
   */
  async getUserFeed(
    userId: number,
    limit = 100,
  ): Promise<UserEventFeedEntry[]> {
    const events = await this.prisma.event.findMany({
      where: { responsibility: { userId } },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fromState: true,
        toState: true,
        occurredAt: true,
        note: true,
        responsibility: {
          select: {
            id: true,
            title: true,
            category: true,
            amount: true,
            person: { select: { id: true, name: true, relation: true } },
          },
        },
      },
    });

    return events.map((e) => ({
      ...e,
      responsibility: {
        ...e.responsibility,
        amount:
          e.responsibility.amount === null
            ? null
            : Number(e.responsibility.amount),
      },
    }));
  }
}
