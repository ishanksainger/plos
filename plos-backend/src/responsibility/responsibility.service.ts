import { Injectable } from '@nestjs/common';
import { CreateResponsibilityDto } from './dto/create-responsibility.dto';
import { ResponsibilityState } from './responsibility.state';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  EventService,
  type ResponsibilityTimelineEntry,
} from 'src/event/event.service';
import { computeState } from './compute-state';

@Injectable()
export class ResponsibilityService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  async create(dto: CreateResponsibilityDto) {
    const responsibility = await this.prisma.responsibility.create({
      data: {
        title: dto.title,
        category: dto.category,
        dueDate: new Date(dto.dueDate),
        userId: dto.userId,
      },
    });

    return responsibility;
  }

  async markComplete(id: number) {
    const responsibility = await this.prisma.responsibility.findUnique({
      where: { id },
    });

    if (!responsibility) {
      throw new Error('Responsibility not found');
    }

    // 2. Compute current state BEFORE completion
    const fromState = computeState(
      responsibility.dueDate,
      responsibility.completedAt,
      // new Date(),
    );

    // 3. If already completed, do nothing (idempotent)
    if (fromState === ResponsibilityState.COMPLETED) {
      return responsibility;
    }

    const updated = await this.prisma.responsibility.update({
      where: { id },
      data: {
        completedAt: new Date(),
      },
    });
    // 5. Record transition event
    await this.eventService.recordStateTransition(
      id,
      fromState,
      ResponsibilityState.COMPLETED,
    );

    return updated;
  }

  async getByUser(userId: number, state?: string, category?: string) {
    const responsibilities = await this.prisma.responsibility.findMany({
      where: {
        userId,
        ...(category && { category }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return responsibilities
      .map((r) => ({
        ...r,
        state: computeState(r.dueDate, r.completedAt),
      }))
      .filter((r) =>
        state === undefined ? true : r.state === (state as ResponsibilityState),
      );
  }

  async getById(id: number) {
    const responsibilities = await this.prisma.responsibility.findUnique({
      where: {
        id,
      },
    });
    if (!responsibilities) {
      return null;
    }
    return {
      ...responsibilities,
      state: computeState(
        responsibilities.dueDate,
        responsibilities.completedAt,
      ),
    };
  }

  async delete(id: number) {
    return await this.prisma.responsibility.delete({
      where: { id },
    });
  }

  async getStateSummaryByUser(userId: number) {
    const responsibilities = await this.prisma.responsibility.findMany({
      where: { userId },
      select: {
        dueDate: true,
        completedAt: true,
      },
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
