import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateResponsibilityDto } from './dto/create-responsibility.dto';
import { UpdateResponsibilityDto } from './dto/update-responsibility.dto';
import { ResponsibilityState } from './responsibility.state';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  EventService,
  type ResponsibilityTimelineEntry,
} from 'src/event/event.service';
import { computeState } from './compute-state';
import { computeNextDueDate } from './compute-next-due';
import { RECURRING_COMPLETION_NOTE_PREFIX } from 'src/event/activity-completion';
import { NotificationService } from 'src/notification/notification.service';
import { PlanService } from 'src/plan/plan.service';
import { computeStreakFromCompletionDays, localDayKey } from './habit-streaks';

@Injectable()
export class ResponsibilityService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
    private notificationService: NotificationService,
    private plan: PlanService,
  ) {}

  async create(dto: CreateResponsibilityDto) {
    // Dormant plan-limit guard (no-op until BILLING_ENABLED). Free tier = 50.
    const count = await this.prisma.responsibility.count({
      where: { userId: dto.userId as number },
    });
    await this.plan.assertCanCreate(
      dto.userId as number,
      'responsibilities',
      count,
    );

    return this.prisma.responsibility.create({
      data: {
        title: dto.title,
        category: dto.category,
        module: dto.module,
        dueDate: new Date(dto.dueDate),
        userId: dto.userId as number, // always set by controller from JWT
        personId: dto.personId,
        amount: dto.amount,
        recurrence: dto.recurrence ?? 'none',
        notes: dto.notes,
      },
      include: { person: true },
    });
  }

  /**
   * One-shot tasks: sets `completedAt` and records transition to COMPLETED.
   * Recurring tasks: advances `dueDate` by the recurrence rule, keeps `completedAt` null,
   * and records a transition to the new lifecycle state (with `force` so duplicate `toState` rows are allowed).
   */
  async markComplete(id: number, userId: number) {
    const responsibility = await this.prisma.responsibility.findFirst({
      where: { id, userId },
    });
    if (!responsibility)
      throw new NotFoundException('Responsibility not found');

    const fromState = computeState(
      responsibility.dueDate,
      responsibility.completedAt,
    );
    if (fromState === ResponsibilityState.COMPLETED) {
      const existingDone = await this.prisma.responsibility.findFirst({
        where: { id, userId },
        include: { person: true },
      });
      if (!existingDone)
        throw new NotFoundException('Responsibility not found');
      return { ...existingDone, state: ResponsibilityState.COMPLETED };
    }

    const recurrence = responsibility.recurrence ?? 'none';
    const isRecurring = recurrence !== 'none';

    if (isRecurring) {
      const nextDue = computeNextDueDate(
        new Date(responsibility.dueDate),
        recurrence,
      );
      const updated = await this.prisma.responsibility.update({
        where: { id },
        data: {
          dueDate: nextDue,
          completedAt: null,
        },
        include: { person: true },
      });
      const toState = computeState(nextDue, null);
      const note = `${RECURRING_COMPLETION_NOTE_PREFIX} — next due ${nextDue.toISOString().slice(0, 10)}`;
      await this.eventService.recordStateTransition(id, fromState, toState, {
        force: true,
        note,
      });
      await this.notificationService.notifyTaskCompleted({
        userId,
        responsibilityId: id,
        taskTitle: responsibility.title,
        recurring: true,
        nextDueLabel: nextDue.toISOString().slice(0, 10),
      });
      return { ...updated, state: toState };
    }

    const updated = await this.prisma.responsibility.update({
      where: { id },
      data: { completedAt: new Date() },
      include: { person: true },
    });

    await this.eventService.recordStateTransition(
      id,
      fromState,
      ResponsibilityState.COMPLETED,
    );
    await this.notificationService.notifyTaskCompleted({
      userId,
      responsibilityId: id,
      taskTitle: responsibility.title,
      recurring: false,
    });
    return { ...updated, state: ResponsibilityState.COMPLETED };
  }

  async getByUser(
    userId: number,
    state?: string,
    category?: string,
    personId?: number,
  ) {
    const responsibilities = await this.prisma.responsibility.findMany({
      where: {
        userId,
        ...(category && { category }),
        ...(personId && { personId }),
      },
      include: { person: true },
      orderBy: { dueDate: 'asc' },
    });

    return responsibilities
      .map((r) => ({ ...r, state: computeState(r.dueDate, r.completedAt) }))
      .filter((r) =>
        state === undefined ? true : r.state === (state as ResponsibilityState),
      );
  }

  async getById(id: number, userId: number) {
    const r = await this.prisma.responsibility.findFirst({
      where: { id, userId },
      include: { person: true },
    });
    if (!r) throw new NotFoundException('Responsibility not found');
    return { ...r, state: computeState(r.dueDate, r.completedAt) };
  }

  /**
   * Applies partial fields from `dto`. Only defined keys are written.
   */
  async update(id: number, userId: number, dto: UpdateResponsibilityDto) {
    const existing = await this.prisma.responsibility.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Responsibility not found');

    const data: Prisma.ResponsibilityUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.module !== undefined) data.module = dto.module;
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.personId !== undefined) data.personId = dto.personId;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.recurrence !== undefined) data.recurrence = dto.recurrence;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.responsibility.update({
      where: { id },
      data,
      include: { person: true },
    });
  }

  async delete(id: number, userId: number) {
    const existing = await this.prisma.responsibility.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Responsibility not found');
    return this.prisma.responsibility.delete({ where: { id } });
  }

  /**
   * Completion-based streaks for responsibilities in the **habit** category (recurring logs
   * and one-shot completes), plus module-level aggregates for the Habits UI.
   */
  async getHabitStreaks(userId: number) {
    const habits = await this.prisma.responsibility.findMany({
      where: { userId, category: 'habit' },
      select: { id: true, title: true, recurrence: true, completedAt: true },
    });
    const ids = habits.map((h) => h.id);
    if (ids.length === 0) {
      return {
        items: [] as {
          id: number;
          title: string;
          recurrence: string;
          streak: number;
        }[],
        maxStreak: 0,
        activeRecurring: 0,
        completionsLast7Days: 0,
      };
    }

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    let completionsLast7Days = 0;
    const byResp = new Map<number, Set<string>>();
    for (const e of events) {
      const at = new Date(e.occurredAt);
      if (at >= weekStart) completionsLast7Days += 1;
      let set = byResp.get(e.responsibilityId);
      if (!set) {
        set = new Set<string>();
        byResp.set(e.responsibilityId, set);
      }
      set.add(localDayKey(at));
    }

    const items = habits.map((h) => ({
      id: h.id,
      title: h.title,
      recurrence: h.recurrence ?? 'none',
      streak: computeStreakFromCompletionDays(
        byResp.get(h.id) ?? new Set(),
        today,
      ),
    }));
    const maxStreak = items.reduce((m, i) => Math.max(m, i.streak), 0);
    const activeRecurring = habits.filter(
      (h) => (h.recurrence ?? 'none') !== 'none' && !h.completedAt,
    ).length;

    return { items, maxStreak, activeRecurring, completionsLast7Days };
  }

  /**
   * Per-day completion history for a single habit. Returns the last `days`
   * calendar days (server-local), oldest first, with `{ date, completed }`.
   * `completed` is true when at least one completion event landed on that
   * calendar day. The current day stays unmarked until the user finishes.
   */
  async getHabitHistory(userId: number, habitId: number, daysParam = 42) {
    const days = Math.max(7, Math.min(180, Math.floor(daysParam) || 42));

    const habit = await this.prisma.responsibility.findFirst({
      where: { id: habitId, userId, category: 'habit' },
      select: { id: true, title: true },
    });
    if (!habit) throw new NotFoundException('Habit not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - (days - 1));

    const events = await this.prisma.event.findMany({
      where: {
        responsibilityId: habitId,
        occurredAt: { gte: windowStart },
        OR: [
          { toState: ResponsibilityState.COMPLETED },
          { note: { startsWith: RECURRING_COMPLETION_NOTE_PREFIX } },
        ],
      },
      select: { occurredAt: true },
    });

    const completionDays = new Set<string>();
    for (const e of events)
      completionDays.add(localDayKey(new Date(e.occurredAt)));

    const items: { date: string; completed: boolean }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(windowStart);
      d.setDate(d.getDate() + i);
      const key = localDayKey(d);
      items.push({ date: key, completed: completionDays.has(key) });
    }

    return { habitId: habit.id, days, items };
  }

  async getStateSummaryByUser(userId: number) {
    const responsibilities = await this.prisma.responsibility.findMany({
      where: { userId },
      select: { dueDate: true, completedAt: true },
    });

    const summary = {
      total: responsibilities.length,
      completed: 0,
      due: 0,
      overdue: 0,
      upcoming: 0,
    };
    for (const r of responsibilities) {
      const state = computeState(r.dueDate, r.completedAt);
      switch (state) {
        case ResponsibilityState.COMPLETED:
          summary.completed++;
          break;
        case ResponsibilityState.DUE:
          summary.due++;
          break;
        case ResponsibilityState.OVERDUE:
          summary.overdue++;
          break;
        case ResponsibilityState.UPCOMING:
          summary.upcoming++;
          break;
      }
    }
    return summary;
  }

  getTimeline(
    responsibilityId: number,
  ): Promise<ResponsibilityTimelineEntry[]> {
    return this.eventService.getTimelineByResponsibility(responsibilityId);
  }
}
