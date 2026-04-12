import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponsibilityState } from 'src/responsibility/responsibility.state';
import { computeState } from 'src/responsibility/compute-state';
import { Responsibility } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
      },
    });

    return user;
  }

  async getDashboard(userId: number) {
    const responsibilties = await this.prisma.responsibility.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const dashboard: {
      summary: {
        total: number;
        completed: number;
        due: number;
        overdue: number;
        upcoming: number;
      };
      overdue: Responsibility[];
      dueToday: Responsibility[];
      upcoming: Responsibility[];
      recentlyCompleted: Responsibility[];
    } = {
      summary: {
        total: responsibilties.length,
        completed: 0,
        due: 0,
        overdue: 0,
        upcoming: 0,
      },
      overdue: [],
      dueToday: [],
      upcoming: [],
      recentlyCompleted: [],
    };

    for (const r of responsibilties) {
      const state = computeState(r.dueDate, r.completedAt);

      switch (state) {
        case ResponsibilityState.COMPLETED:
          dashboard.summary.completed++;
          dashboard.recentlyCompleted.push(r);
          break;
        case ResponsibilityState.DUE:
          dashboard.summary.due++;
          dashboard.dueToday.push(r);
          break;

        case ResponsibilityState.OVERDUE:
          dashboard.summary.overdue++;
          dashboard.overdue.push(r);
          break;

        case ResponsibilityState.UPCOMING:
          dashboard.summary.upcoming++;
          dashboard.upcoming.push(r);
          break;
      }
    }
    dashboard.recentlyCompleted = dashboard.recentlyCompleted
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      )
      .slice(0, 5);

    return dashboard;
  }
}
