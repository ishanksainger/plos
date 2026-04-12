import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventService } from 'src/event/event.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { computeState } from 'src/responsibility/compute-state';

@Injectable()
export class SchedulerService {
  constructor(
    private prisma: PrismaService,
    private eventService: EventService,
  ) {}

  @Cron('0 0 * * *') // 👈 every minute (testing)
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
          await this.eventService.recordStateTransition(
            r.id,
            yesterdayState,
            todayState,
          );
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
