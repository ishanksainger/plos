import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponsibilityState } from 'src/responsibility/responsibility.state';
import { computeState } from 'src/responsibility/compute-state';
import {
  computeStreakFromCompletionDays,
  localDayKey,
} from 'src/responsibility/habit-streaks';
import { RECURRING_COMPLETION_NOTE_PREFIX } from 'src/event/activity-completion';
import { EventService } from 'src/event/event.service';
import {
  addDaysToDayKey,
  dayKeyInTimezone,
  resolveTimezone,
} from 'src/common/timezone';

const BUCKET_CAP = 50;

/** Open or completed-today row returned to the client. */
export type TodayResponsibilityDto = {
  id: number;
  title: string;
  category: string;
  module: string | null;
  dueDate: Date;
  completedAt: Date | null;
  amount: number | null;
  recurrence: string;
  notes: string | null;
  personId: number | null;
  person: { id: number; name: string; relation: string } | null;
  state: ResponsibilityState;
};

/**
 * Builds the Today home payload: timezone-aware buckets + diary feed inputs.
 */
@Injectable()
export class TodayService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  /**
   * Returns overdue, due today, upcoming week, completed today, streaks at risk, and recent events.
   */
  async getToday(userId: number, tzQuery?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timeZone = resolveTimezone(tzQuery ?? user?.timezone);
    const now = new Date();
    const todayKey = dayKeyInTimezone(timeZone, now);
    const tomorrowKey = addDaysToDayKey(todayKey, 1);
    const weekEndKey = addDaysToDayKey(todayKey, 7);

    const responsibilities = await this.prisma.responsibility.findMany({
      where: { userId },
      include: { person: true },
      orderBy: [{ dueDate: 'asc' }, { category: 'asc' }],
    });

    const overdue: TodayResponsibilityDto[] = [];
    const dueToday: TodayResponsibilityDto[] = [];
    const upcoming7: TodayResponsibilityDto[] = [];
    const completedToday: TodayResponsibilityDto[] = [];

    for (const r of responsibilities) {
      const state = computeState(r.dueDate, r.completedAt);
      const row: TodayResponsibilityDto = {
        ...r,
        module: r.module,
        state,
        amount: r.amount === null ? null : Number(r.amount),
      };

      if (r.completedAt) {
        const completedKey = dayKeyInTimezone(
          timeZone,
          new Date(r.completedAt),
        );
        if (completedKey === todayKey) {
          completedToday.push(row);
        }
        continue;
      }

      const dueKey = dayKeyInTimezone(timeZone, new Date(r.dueDate));
      if (dueKey < todayKey) {
        overdue.push(row);
      } else if (dueKey === todayKey) {
        dueToday.push(row);
      } else if (dueKey >= tomorrowKey && dueKey <= weekEndKey) {
        upcoming7.push(row);
      }
    }

    const cap = <T>(arr: T[]) => arr.slice(0, BUCKET_CAP);

    const [streaksAtRisk, recentEvents] = await Promise.all([
      this.getStreaksAtRisk(userId, todayKey),
      this.eventService.getUserFeed(userId, 20),
    ]);

    return {
      timeZone,
      todayKey,
      overdue: cap(overdue),
      dueToday: cap(dueToday),
      upcoming7: cap(upcoming7),
      completedToday: cap(completedToday),
      streaksAtRisk,
      recentEvents,
    };
  }

  /**
   * Habits with an active streak but no completion logged today (calendar day, server-local for streak set).
   */
  private async getStreaksAtRisk(userId: number, _todayKey: string) {
    const habits = await this.prisma.responsibility.findMany({
      where: { userId, category: 'habit', completedAt: null },
      select: { id: true, title: true, recurrence: true },
    });
    if (habits.length === 0) return [];

    const ids = habits.map((h) => h.id);
    const events = await this.prisma.event.findMany({
      where: {
        responsibilityId: { in: ids },
        OR: [
          { toState: ResponsibilityState.COMPLETED },
          { note: { startsWith: RECURRING_COMPLETION_NOTE_PREFIX } },
        ],
      },
      select: { responsibilityId: true, occurredAt: true },
      orderBy: { occurredAt: 'desc' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const serverTodayKey = localDayKey(todayStart);

    const byResp = new Map<
      number,
      { days: Set<string>; lastAt: Date | null }
    >();
    for (const e of events) {
      let entry = byResp.get(e.responsibilityId);
      if (!entry) {
        entry = { days: new Set<string>(), lastAt: null };
        byResp.set(e.responsibilityId, entry);
      }
      entry.days.add(localDayKey(new Date(e.occurredAt)));
      if (!entry.lastAt) entry.lastAt = new Date(e.occurredAt);
    }

    const atRisk: {
      id: number;
      title: string;
      streakLength: number;
      lastCompletedAt: string | null;
    }[] = [];

    for (const h of habits) {
      const entry = byResp.get(h.id);
      const days = entry?.days ?? new Set<string>();
      const streakLength = computeStreakFromCompletionDays(days, todayStart);
      if (streakLength < 1) continue;
      if (days.has(serverTodayKey)) continue;
      atRisk.push({
        id: h.id,
        title: h.title,
        streakLength,
        lastCompletedAt: entry?.lastAt?.toISOString() ?? null,
      });
    }

    return atRisk.sort((a, b) => b.streakLength - a.streakLength);
  }
}
