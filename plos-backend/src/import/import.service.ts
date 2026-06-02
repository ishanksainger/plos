import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlanService } from '../plan/plan.service';
import {
  moduleForCategory,
  normalizeCategory,
  normalizeRecurrence,
  parseAmount,
  parseCsvRecords,
  parseDueDate,
  pick,
} from './csv.util';

export type ImportRowError = { row: number; reason: string };

export type ImportSummary = {
  created: number;
  skipped: number;
  total: number;
  errors: ImportRowError[];
};

/** Column aliases the importer understands (all matched case-insensitively). */
const COLS = {
  title: ['title', 'name', 'task', 'item', 'responsibility', 'description'],
  dueDate: ['duedate', 'due date', 'due', 'date', 'deadline'],
  category: ['category', 'type', 'module'],
  amount: ['amount', 'value', 'cost', 'price'],
  recurrence: ['recurrence', 'repeat', 'frequency'],
  notes: ['notes', 'note', 'remark', 'remarks', 'comment', 'comments'],
  person: ['person', 'who', 'assignee', 'owner', 'member'],
};

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plan: PlanService,
  ) {}

  /**
   * Import responsibilities from a tracker CSV. Plan-gated on two axes
   * (both dormant-safe — no-ops until BILLING_ENABLED):
   *   1. the number of imports (free = 1), and
   *   2. the resulting responsibility count (free = 50).
   * Validates every row, creates the valid ones transactionally, and reports
   * exactly which rows were skipped and why.
   */
  async importResponsibilities(
    userId: number,
    csvText: string,
  ): Promise<ImportSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { importsUsed: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Import-count gate (free tier: 1 import).
    await this.plan.assertCanCreate(userId, 'imports', user.importsUsed);

    const records = parseCsvRecords(csvText);
    if (records.length === 0) {
      throw new BadRequestException(
        'No data rows found. The file needs a header row plus at least one row.',
      );
    }

    // Resolve optional person-by-name against the user's existing contacts.
    const persons = await this.prisma.person.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const personByName = new Map(
      persons.map((p) => [p.name.trim().toLowerCase(), p.id]),
    );

    const toCreate: Prisma.ResponsibilityCreateManyInput[] = [];
    const errors: ImportRowError[] = [];

    records.forEach((rec, idx) => {
      const rowNum = idx + 2; // +1 for header, +1 for 1-based

      const title = pick(rec, COLS.title);
      if (!title) {
        errors.push({ row: rowNum, reason: 'missing title' });
        return;
      }

      const dueRaw = pick(rec, COLS.dueDate);
      const dueDate = parseDueDate(dueRaw);
      if (!dueDate) {
        errors.push({
          row: rowNum,
          reason: dueRaw ? `unrecognized date "${dueRaw}"` : 'missing due date',
        });
        return;
      }

      const category = normalizeCategory(pick(rec, COLS.category));
      const personName = pick(rec, COLS.person);

      toCreate.push({
        title,
        category,
        module: moduleForCategory(category),
        dueDate,
        amount: parseAmount(pick(rec, COLS.amount)),
        recurrence: normalizeRecurrence(pick(rec, COLS.recurrence)),
        notes: pick(rec, COLS.notes) || undefined,
        personId: personName
          ? personByName.get(personName.toLowerCase())
          : undefined,
        userId,
      });
    });

    if (toCreate.length === 0) {
      return {
        created: 0,
        skipped: errors.length,
        total: records.length,
        errors,
      };
    }

    // Responsibility-count gate (free tier: 50). Dormant-safe: limit is null
    // while billing is off, so this block is skipped.
    const limits = await this.plan.limitsFor(userId);
    if (limits.maxResponsibilities !== null) {
      const current = await this.prisma.responsibility.count({
        where: { userId },
      });
      if (current + toCreate.length > limits.maxResponsibilities) {
        throw new ForbiddenException({
          code: 'PLAN_LIMIT_REACHED',
          resource: 'responsibilities',
          limit: limits.maxResponsibilities,
          message: `This import would put you over the free-plan limit of ${limits.maxResponsibilities} responsibilities. Upgrade to Pro for unlimited.`,
        });
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const res = await tx.responsibility.createMany({ data: toCreate });
      await tx.user.update({
        where: { id: userId },
        data: { importsUsed: { increment: 1 } },
      });
      return res.count;
    });

    return { created, skipped: errors.length, total: records.length, errors };
  }

  /** A ready-to-fill CSV template with the supported columns + one example row. */
  buildTemplate(): string {
    const header = 'title,category,dueDate,amount,recurrence,notes,person';
    const example =
      'Pay advance tax,finance,2026-07-31,18000,yearly,Freelance income,Self';
    const example2 =
      'Mom doctor visit,health,2026-06-20,,none,Annual checkup,Mother';
    return `${header}\n${example}\n${example2}\n`;
  }
}
