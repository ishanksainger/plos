import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventService } from 'src/event/event.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { computeState } from 'src/responsibility/compute-state';
import { NotificationService } from 'src/notification/notification.service';
import { ResponsibilityState } from 'src/responsibility/responsibility.state';
import {
  computeStreakFromCompletionDays,
  localDayKey,
} from 'src/responsibility/habit-streaks';
import { RECURRING_COMPLETION_NOTE_PREFIX } from 'src/event/activity-completion';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Hourly: for every habit whose owner has `streakAtRisk = true`, check
   * if the user has an active streak (≥1 day) and hasn't logged a
   * completion today. After local-noon, fire one in-app reminder so they
   * still have time to act. Idempotent — we only emit once per habit per
   * calendar day, even if the scheduler runs every hour.
   */
  @Cron(
    process.env.STREAK_RISK_CRON?.trim() ||
      (process.env.NODE_ENV === 'production'
        ? CronExpression.EVERY_HOUR
        : CronExpression.EVERY_30_MINUTES),
  )
  async notifyStreaksAtRisk() {
    const now = new Date();
    if (now.getHours() < 12) {
      // Don't nag in the morning — give people half a day to do it first.
      return;
    }

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayKey = localDayKey(today);
    const startOfToday = today;
    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Pull every habit + the owner's pref + the events the streak math needs.
    const habits = await this.prisma.responsibility.findMany({
      where: {
        category: 'habit',
        completedAt: null,
        user: { notificationPrefs: { streakAtRisk: true } },
      },
      select: { id: true, userId: true, title: true },
    });

    if (habits.length === 0) return;

    const habitIds = habits.map((h) => h.id);
    const events = await this.prisma.event.findMany({
      where: {
        responsibilityId: { in: habitIds },
        OR: [
          { toState: ResponsibilityState.COMPLETED },
          { note: { startsWith: RECURRING_COMPLETION_NOTE_PREFIX } },
        ],
      },
      select: { responsibilityId: true, occurredAt: true },
    });

    const completionDaysByHabit = new Map<number, Set<string>>();
    for (const e of events) {
      let set = completionDaysByHabit.get(e.responsibilityId);
      if (!set) {
        set = new Set<string>();
        completionDaysByHabit.set(e.responsibilityId, set);
      }
      set.add(localDayKey(new Date(e.occurredAt)));
    }

    let sent = 0;
    for (const h of habits) {
      const days = completionDaysByHabit.get(h.id) ?? new Set<string>();
      if (days.has(todayKey)) continue; // already done today, no risk

      const streak = computeStreakFromCompletionDays(days, today);
      if (streak < 1) continue; // no streak to lose

      // Don't double-fire if today's reminder already exists.
      const already = await this.prisma.notification.findFirst({
        where: {
          userId: h.userId,
          responsibilityId: h.id,
          type: 'reminder',
          createdAt: { gte: startOfToday, lt: endOfToday },
        },
        select: { id: true },
      });
      if (already) continue;

      await this.notificationService.createInApp({
        userId: h.userId,
        responsibilityId: h.id,
        type: 'reminder',
        title: 'Streak at risk',
        message: `"${h.title}" — you're on a ${streak}-day streak. Log it today to keep it alive.`,
      });
      sent += 1;
    }

    if (sent > 0) {
      this.logger.log(`streak-risk reminders sent: ${sent}`);
    }
  }

  /** Dev: every minute. Prod default: every 5 minutes. Override with SCHEDULER_CRON (cron syntax). */
  @Cron(
    process.env.SCHEDULER_CRON?.trim() ||
      (process.env.NODE_ENV === 'production'
        ? CronExpression.EVERY_5_MINUTES
        : CronExpression.EVERY_MINUTE),
  )
  async checkResponsibilityStateTransitions() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // console.log('\n[SCHEDULER RUN]', now.toISOString());

    const responsibilities = await this.prisma.responsibility.findMany({
      where: {
        completedAt: null,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        dueDate: true,
        completedAt: true,
      },
    });

    for (const r of responsibilities) {
      const yesterdayState = computeState(r.dueDate, r.completedAt, yesterday);
      const todayState = computeState(r.dueDate, r.completedAt, now);

      if (yesterdayState !== todayState) {
        console.log(
          `Responsibility ${r.id}: ${yesterdayState} → ${todayState}`,
        );

        const alreadyRecorded = await this.prisma.event.findFirst({
          where: {
            responsibilityId: r.id,
            fromState: yesterdayState,
            toState: todayState,
          },
        });

        if (!alreadyRecorded) {
          const created = await this.eventService.recordStateTransition(
            r.id,
            yesterdayState,
            todayState,
          );
          if (created) {
            await this.notificationService.notifyResponsibilityScheduleTransition({
              userId: r.userId,
              responsibilityId: r.id,
              taskTitle: r.title,
              toState: todayState as ResponsibilityState,
            });
          }
        }
      }
    }
  }

  // private computeState(
  //   dueDate: Date,
  //   completedAt: Date | null,
  //   referenceDate: Date,
  // ): ResponsibilityState {
  //   if (completedAt) {
  //     return ResponsibilityState.COMPLETED;
  //   }

  //   // Normalize dates to calendar day (ignore time)
  //   const ref = new Date(referenceDate);
  //   ref.setHours(0, 0, 0, 0);

  //   const due = new Date(dueDate);
  //   due.setHours(0, 0, 0, 0);

  //   if (ref.getTime() > due.getTime()) {
  //     return ResponsibilityState.OVERDUE;
  //   }

  //   if (ref.getTime() === due.getTime()) {
  //     return ResponsibilityState.DUE;
  //   }

  //   return ResponsibilityState.UPCOMING;
  // }
}
