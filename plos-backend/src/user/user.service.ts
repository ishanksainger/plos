import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponsibilityState } from 'src/responsibility/responsibility.state';
import { computeState } from 'src/responsibility/compute-state';
import { RECURRING_COMPLETION_NOTE_PREFIX } from 'src/event/activity-completion';
import { ensureBareUserDashboardDummy } from './dashboard-dummy-seed';

/** Number of calendar days (inclusive) for dashboard activity sparkline. */
const ACTIVITY_SERIES_DAYS = 14;

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: { email: dto.email, name: dto.name },
    });
  }

  async getDashboard(userId: number) {
    await ensureBareUserDashboardDummy(this.prisma, userId);
    const [responsibilities, persons, activitySeries] = await Promise.all([
      this.prisma.responsibility.findMany({
        where: { userId },
        include: { person: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.person.findMany({ where: { userId } }),
      this.getActivityCompletionSeries(userId, ACTIVITY_SERIES_DAYS),
    ]);

    const summary = { total: responsibilities.length, completed: 0, due: 0, overdue: 0, upcoming: 0 };
    const overdue: typeof responsibilities = [];
    const dueToday: typeof responsibilities = [];
    const upcoming: typeof responsibilities = [];
    const recentlyCompleted: typeof responsibilities = [];

    // Category breakdown
    const categoryCount: Record<string, number> = {};
    // Person load
    const personLoad: Record<number, { name: string; relation: string; count: number }> = {};
    // Financial pressure: monthly totals for next 6 months
    const financialPressure: Record<string, number> = {};

    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      financialPressure[key] = 0;
    }

    for (const r of responsibilities) {
      const state = computeState(r.dueDate, r.completedAt);
      const withState = { ...r, state };

      // Summary
      switch (state) {
        case ResponsibilityState.COMPLETED:
          summary.completed++;
          recentlyCompleted.push(withState as typeof withState);
          break;
        case ResponsibilityState.DUE:
          summary.due++;
          dueToday.push(withState as typeof withState);
          break;
        case ResponsibilityState.OVERDUE:
          summary.overdue++;
          overdue.push(withState as typeof withState);
          break;
        case ResponsibilityState.UPCOMING:
          summary.upcoming++;
          upcoming.push(withState as typeof withState);
          break;
      }

      // Category breakdown
      categoryCount[r.category] = (categoryCount[r.category] ?? 0) + 1;

      // Person load
      if (r.personId && r.person) {
        if (!personLoad[r.personId]) {
          personLoad[r.personId] = { name: r.person.name, relation: r.person.relation, count: 0 };
        }
        personLoad[r.personId].count++;
      }

      // Financial pressure (next 6 months, non-completed with amount)
      if (state !== ResponsibilityState.COMPLETED && r.amount) {
        const key = `${r.dueDate.getFullYear()}-${String(r.dueDate.getMonth() + 1).padStart(2, '0')}`;
        if (key in financialPressure) {
          financialPressure[key] += Number(r.amount);
        }
      }
    }

    const completionRate = summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

    return {
      summary: { ...summary, completionRate },
      overdue,
      dueToday,
      upcoming: upcoming.slice(0, 20),
      recentlyCompleted: recentlyCompleted
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 5),
      categoryBreakdown: Object.entries(categoryCount).map(([category, count]) => ({ category, count })),
      personLoad: Object.values(personLoad),
      financialPressure: Object.entries(financialPressure).map(([month, total]) => ({ month, total })),
      persons,
      activitySeries,
    };
  }

  /**
   * Builds one count per calendar day (server local TZ) for the last `numberOfDays` days,
   * oldest → newest. Counts timeline events that represent a “completion”: transition to
   * COMPLETED, or recurring occurrence notes written by `markComplete`.
   */
  private async getActivityCompletionSeries(
    userId: number,
    numberOfDays: number,
  ): Promise<{ date: string; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDay = new Date(today);
    firstDay.setDate(firstDay.getDate() - (numberOfDays - 1));

    const events = await this.prisma.event.findMany({
      where: {
        occurredAt: { gte: firstDay },
        responsibility: { userId },
        OR: [
          { toState: ResponsibilityState.COMPLETED },
          { note: { startsWith: RECURRING_COMPLETION_NOTE_PREFIX } },
        ],
      },
      select: { occurredAt: true },
    });

    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const counts = new Map<string, number>();
    for (const e of events) {
      const k = dayKey(new Date(e.occurredAt));
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const series: { date: string; count: number }[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() + i);
      const k = dayKey(d);
      series.push({ date: k, count: counts.get(k) ?? 0 });
    }
    return series;
  }
}
