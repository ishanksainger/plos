import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { computeState } from 'src/responsibility/compute-state';

const MAX_HITS = 6;
const MIN_QUERY_LENGTH = 1;

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cross-entity search for the topbar palette. Returns up to `MAX_HITS`
   * matches per kind, scoped to the caller's user id. Case-insensitive
   * `contains` against the obvious fields (title/category/notes for
   * responsibilities, name/email/relation for persons).
   */
  async search(userId: number, rawQuery: string) {
    const q = (rawQuery ?? '').trim();
    if (q.length < MIN_QUERY_LENGTH) {
      return { responsibilities: [], persons: [] };
    }

    const contains: Prisma.StringFilter = { contains: q, mode: 'insensitive' };

    const [responsibilities, persons] = await Promise.all([
      this.prisma.responsibility.findMany({
        where: {
          userId,
          OR: [
            { title: contains },
            { category: contains },
            { notes: contains },
            { module: contains },
          ],
        },
        include: {
          person: { select: { id: true, name: true, relation: true } },
        },
        orderBy: [
          { completedAt: { sort: 'asc', nulls: 'first' } },
          { dueDate: 'asc' },
        ],
        take: MAX_HITS,
      }),
      this.prisma.person.findMany({
        where: {
          userId,
          OR: [{ name: contains }, { email: contains }, { relation: contains }],
        },
        include: {
          _count: { select: { responsibilities: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: MAX_HITS,
      }),
    ]);

    return {
      responsibilities: responsibilities.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        module: r.module,
        dueDate: r.dueDate,
        completedAt: r.completedAt,
        amount: r.amount ? r.amount.toString() : null,
        recurrence: r.recurrence,
        notes: r.notes,
        personId: r.personId,
        person: r.person,
        state: computeState(r.dueDate, r.completedAt),
      })),
      persons,
    };
  }
}
