import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponsibilityState } from 'src/responsibility/responsibility.state';

/** Delivered to the in-app feed immediately (no external queue in MVP). */
export const NOTIFICATION_CHANNEL_IN_APP = 'in_app';

export type NotificationListItem = {
  id: number;
  type: string;
  channel: string;
  title: string;
  message: string | null;
  readAt: Date | null;
  createdAt: Date;
  responsibilityId: number | null;
  responsibility: { id: number; title: string } | null;
};

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts an in-app notification row (treated as already delivered to the feed).
   */
  async createInApp(params: {
    userId: number;
    responsibilityId?: number | null;
    type: 'state_change' | 'reminder' | 'digest';
    title: string;
    message?: string | null;
  }) {
    const now = new Date();
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        responsibilityId: params.responsibilityId ?? undefined,
        type: params.type,
        channel: NOTIFICATION_CHANNEL_IN_APP,
        status: 'sent',
        sentAt: now,
        title: params.title,
        message: params.message ?? null,
      },
    });
  }

  /**
   * When the scheduler records a lifecycle transition, surface DUE / OVERDUE in the feed.
   */
  async notifyResponsibilityScheduleTransition(params: {
    userId: number;
    responsibilityId: number;
    taskTitle: string;
    toState: ResponsibilityState;
  }) {
    const { toState } = params;
    if (toState !== ResponsibilityState.DUE && toState !== ResponsibilityState.OVERDUE) {
      return null;
    }
    const title = toState === ResponsibilityState.OVERDUE ? 'Task overdue' : 'Due today';
    const message =
      toState === ResponsibilityState.OVERDUE
        ? `"${params.taskTitle}" is now overdue.`
        : `"${params.taskTitle}" is due today.`;
    return this.createInApp({
      userId: params.userId,
      responsibilityId: params.responsibilityId,
      type: 'state_change',
      title,
      message,
    });
  }

  /**
   * User completed a responsibility (one-shot or recurring occurrence).
   */
  async notifyTaskCompleted(params: {
    userId: number;
    responsibilityId: number;
    taskTitle: string;
    recurring: boolean;
    nextDueLabel?: string | null;
  }) {
    const title = params.recurring ? 'Recurring task logged' : 'Task completed';
    const message = params.recurring
      ? `"${params.taskTitle}" — next due ${params.nextDueLabel ?? 'soon'}.`
      : `"${params.taskTitle}" marked complete.`;
    return this.createInApp({
      userId: params.userId,
      responsibilityId: params.responsibilityId,
      type: 'state_change',
      title,
      message,
    });
  }

  /**
   * Newest first in-app feed for the user.
   */
  async listForUser(userId: number, limit = 50): Promise<NotificationListItem[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, channel: NOTIFICATION_CHANNEL_IN_APP },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: {
        id: true,
        type: true,
        channel: true,
        title: true,
        message: true,
        readAt: true,
        createdAt: true,
        responsibilityId: true,
        responsibility: { select: { id: true, title: true } },
      },
    });
    return rows;
  }

  /**
   * Count of in-app notifications with no `readAt`.
   */
  async unreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, channel: NOTIFICATION_CHANNEL_IN_APP, readAt: null },
    });
  }

  /**
   * Marks a single notification read if it belongs to the user.
   */
  async markRead(userId: number, id: number) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId, channel: NOTIFICATION_CHANNEL_IN_APP },
    });
    if (!row) throw new NotFoundException('Notification not found');
    if (row.readAt) return row;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  /**
   * Marks all in-app notifications read for the user.
   */
  async markAllRead(userId: number) {
    const now = new Date();
    await this.prisma.notification.updateMany({
      where: { userId, channel: NOTIFICATION_CHANNEL_IN_APP, readAt: null },
      data: { readAt: now },
    });
    return { updated: true };
  }
}
