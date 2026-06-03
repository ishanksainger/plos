import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface UpdateNotificationPrefsDto {
  inAppEnabled?: boolean;
  emailDigests?: boolean;
  whatsappOptIn?: boolean;
  streakAtRisk?: boolean;
}

/**
 * Owns the per-user notification toggle row. Lazily creates the row on
 * first read so existing accounts don't need a backfill migration.
 */
@Injectable()
export class NotificationPrefsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: number) {
    const existing = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });
    if (existing) return this.shape(existing);

    const created = await this.prisma.notificationPreferences.create({
      data: { userId },
    });
    return this.shape(created);
  }

  async update(userId: number, dto: UpdateNotificationPrefsDto) {
    // Ensure the row exists, then patch only the keys the caller supplied.
    await this.getOrCreate(userId);
    const updated = await this.prisma.notificationPreferences.update({
      where: { userId },
      data: {
        ...(dto.inAppEnabled !== undefined
          ? { inAppEnabled: dto.inAppEnabled }
          : {}),
        ...(dto.emailDigests !== undefined
          ? { emailDigests: dto.emailDigests }
          : {}),
        ...(dto.whatsappOptIn !== undefined
          ? { whatsappOptIn: dto.whatsappOptIn }
          : {}),
        ...(dto.streakAtRisk !== undefined
          ? { streakAtRisk: dto.streakAtRisk }
          : {}),
      },
    });
    return this.shape(updated);
  }

  private shape(row: {
    inAppEnabled: boolean;
    emailDigests: boolean;
    whatsappOptIn: boolean;
    streakAtRisk: boolean;
    updatedAt: Date;
  }) {
    return {
      inAppEnabled: row.inAppEnabled,
      emailDigests: row.emailDigests,
      whatsappOptIn: row.whatsappOptIn,
      streakAtRisk: row.streakAtRisk,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
