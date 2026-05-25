import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type ExportFormat = 'json' | 'csv';

export interface ExportPayload {
  filename: string;
  contentType: string;
  body: string;
}

/**
 * Builds a portable dump of a user's data. JSON returns the full
 * nested structure; CSV flattens responsibilities (the most useful
 * row-oriented data) into a single sheet.
 */
@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async build(userId: number, format: ExportFormat): Promise<ExportPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        persons: true,
        responsibilities: {
          include: {
            person: { select: { id: true, name: true, relation: true } },
            events: {
              orderBy: { occurredAt: 'asc' },
              select: { fromState: true, toState: true, note: true, occurredAt: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            type: true,
            channel: true,
            status: true,
            title: true,
            message: true,
            createdAt: true,
            readAt: true,
          },
        },
        notificationPrefs: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const today = new Date();
    const stampParts = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ];
    const stamp = stampParts.join('-');
    const slug = user.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (format === 'csv') {
      return {
        filename: `plos-${slug}-responsibilities-${stamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        body: toResponsibilitiesCsv(user.responsibilities),
      };
    }

    const payload = {
      exportedAt: today.toISOString(),
      schemaVersion: 1,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        currency: user.currency,
        accountType: user.accountType,
        createdAt: user.createdAt,
      },
      notificationPrefs: user.notificationPrefs
        ? {
            inAppEnabled: user.notificationPrefs.inAppEnabled,
            emailDigests: user.notificationPrefs.emailDigests,
            whatsappOptIn: user.notificationPrefs.whatsappOptIn,
            streakAtRisk: user.notificationPrefs.streakAtRisk,
            updatedAt: user.notificationPrefs.updatedAt,
          }
        : null,
      persons: user.persons.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        relation: p.relation,
        dateOfBirth: p.dateOfBirth,
        avatarUrl: p.avatarUrl,
        createdAt: p.createdAt,
      })),
      responsibilities: user.responsibilities.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        module: r.module,
        dueDate: r.dueDate,
        completedAt: r.completedAt,
        amount: r.amount ? r.amount.toString() : null,
        recurrence: r.recurrence,
        notes: r.notes,
        createdAt: r.createdAt,
        person: r.person,
        timeline: r.events,
      })),
      notifications: user.notifications,
    };

    return {
      filename: `plos-${slug}-export-${stamp}.json`,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(payload, null, 2),
    };
  }
}

type ResponsibilityForCsv = {
  id: number;
  title: string;
  category: string;
  module: string | null;
  dueDate: Date;
  completedAt: Date | null;
  amount: { toString: () => string } | null;
  recurrence: string;
  notes: string | null;
  createdAt: Date;
  person?: { id: number; name: string; relation: string } | null;
};

function toResponsibilitiesCsv(rows: ResponsibilityForCsv[]): string {
  const headers = [
    'id',
    'title',
    'category',
    'module',
    'dueDate',
    'completedAt',
    'amount',
    'recurrence',
    'notes',
    'personId',
    'personName',
    'personRelation',
    'createdAt',
  ];
  const lines: string[] = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.title,
        r.category,
        r.module ?? '',
        toIsoDay(r.dueDate),
        r.completedAt ? toIsoDay(r.completedAt) : '',
        r.amount ? r.amount.toString() : '',
        r.recurrence,
        r.notes ?? '',
        r.person?.id ?? '',
        r.person?.name ?? '',
        r.person?.relation ?? '',
        toIsoDay(r.createdAt),
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n');
}

function toIsoDay(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString();
}

function csvEscape(value: string | number): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
