import { PrismaClient } from '@prisma/client';
import { RECURRING_COMPLETION_NOTE_PREFIX } from 'src/event/activity-completion';

/** Marks rows inserted by dashboard dummy seed so they can be wiped or replaced cleanly. */
export const DASHBOARD_DUMMY_SEED_MARKER = '[PLOS seed]' as const;

/**
 * Namespace integer for Postgres `pg_advisory_xact_lock` (avoids double-seed races on cold accounts).
 *
 * Arbitrary stable constant for this codebase only (not cryptographic).
 */
const DASHBOARD_SEED_LOCK_NS = 5_891_734;

/** Keeps seeded completion events aligned with the dashboard activity window (14 days, oldest → newest). */
const ACTIVITY_SERIES_DAY_COUNT = 14;

type DbLike = Pick<
  PrismaClient,
  'person' | 'responsibility' | 'event' | '$executeRawUnsafe'
>;

/**
 * Returns a noon-local calendar adjustment from the given day's date part.
 *
 * @param base Day anchor (typically midnight-normalized **today**).
 * @param deltaDays Offset in whole calendar days.
 */
function addCalendarDays(base: Date, deltaDays: number): Date {
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();
  return new Date(y, m, d + deltaDays, 12, 0, 0, 0);
}

async function wipeSeedArtifacts(db: DbLike, userId: number): Promise<void> {
  const seeded = await db.responsibility.findMany({
    where: { userId, title: { startsWith: DASHBOARD_DUMMY_SEED_MARKER } },
    select: { id: true },
  });
  const ids = seeded.map((r) => r.id);
  if (ids.length) {
    await db.event.deleteMany({ where: { responsibilityId: { in: ids } } });
    await db.responsibility.deleteMany({ where: { id: { in: ids } } });
  }
  await db.person.deleteMany({
    where: { userId, name: { startsWith: DASHBOARD_DUMMY_SEED_MARKER } },
  });
}

/**
 * Loads the canonical person anchor for seeded responsibilities (`self`, else earliest person).
 */
async function resolveAnchorPerson(db: DbLike, userId: number) {
  const selfPerson = await db.person.findFirst({
    where: { userId, relation: 'self' },
    orderBy: { id: 'asc' },
  });
  const anchor =
    selfPerson ??
    (await db.person.findFirst({
      where: { userId },
      orderBy: { id: 'asc' },
    }));

  return anchor ?? null;
}

/**
 * Writes the standard dummy bundle (`DASHBOARD_DUMMY_SEED_MARKER` titles, partner person, EMI ladder, timeline events).
 * Caller assumes no conflicting seed rows unless it already wiped.
 *
 * @param db Prisma root client or transactional client compatible with delegated calls.
 * @param userId Account id.
 */
export async function insertDashboardDummyBundle(
  db: DbLike,
  userId: number,
): Promise<void> {
  const anchorPerson = await resolveAnchorPerson(db, userId);
  if (!anchorPerson) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const marker = DASHBOARD_DUMMY_SEED_MARKER;
  const recurringNote = RECURRING_COMPLETION_NOTE_PREFIX;

  const partner = await db.person.create({
    data: {
      userId,
      name: `${marker} Riya Kumar`,
      relation: 'partner',
      email: `seed-partner-${userId}@placeholder.plos.local`,
    },
  });

  const walk = await db.responsibility.create({
    data: {
      userId,
      personId: anchorPerson.id,
      title: `${marker} Morning walk`,
      category: 'habit',
      module: 'habits',
      dueDate: addCalendarDays(today, 1),
      recurrence: 'daily',
    },
  });

  for (let offset = -(ACTIVITY_SERIES_DAY_COUNT - 1); offset <= 0; offset++) {
    await db.event.create({
      data: {
        responsibilityId: walk.id,
        fromState: 'UPCOMING',
        toState: 'COMPLETED',
        occurredAt: addCalendarDays(today, offset),
        note: `${recurringNote} (${offset})`,
      },
    });
  }

  await db.responsibility.createMany({
    data: [
      {
        userId,
        personId: anchorPerson.id,
        title: `${marker} Motor insurance renewal`,
        category: 'finance',
        module: 'finance',
        dueDate: addCalendarDays(today, -5),
        amount: '24000',
        recurrence: 'yearly',
      },
      {
        userId,
        personId: anchorPerson.id,
        title: `${marker} TDS quarterly deposit`,
        category: 'finance',
        module: 'finance',
        dueDate: addCalendarDays(today, 0),
        amount: '18500',
        recurrence: 'quarterly',
      },
      {
        userId,
        personId: partner.id,
        title: `${marker} PTA meeting prep`,
        category: 'family',
        module: 'family',
        dueDate: addCalendarDays(today, 0),
        recurrence: 'none',
      },
      {
        userId,
        personId: anchorPerson.id,
        title: `${marker} Dentist hygiene visit`,
        category: 'health',
        module: 'health',
        dueDate: addCalendarDays(today, 6),
        amount: '3500',
        recurrence: 'none',
      },
      {
        userId,
        personId: anchorPerson.id,
        title: `${marker} Sprint retro notes`,
        category: 'admin',
        module: null,
        dueDate: addCalendarDays(today, 8),
        recurrence: 'weekly',
      },
      {
        userId,
        personId: partner.id,
        title: `${marker} School term fees`,
        category: 'family',
        module: 'family',
        dueDate: addCalendarDays(today, 17),
        amount: '48500',
        recurrence: 'none',
      },
    ],
  });

  const electricity = await db.responsibility.create({
    data: {
      userId,
      personId: anchorPerson.id,
      title: `${marker} Electricity bill`,
      category: 'finance',
      module: 'finance',
      dueDate: addCalendarDays(today, -1),
      completedAt: addCalendarDays(today, -1),
      amount: '4200',
      recurrence: 'monthly',
    },
  });

  await db.event.create({
    data: {
      responsibilityId: electricity.id,
      fromState: 'DUE',
      toState: 'COMPLETED',
      occurredAt: addCalendarDays(today, -1),
    },
  });

  const gym = await db.responsibility.create({
    data: {
      userId,
      personId: anchorPerson.id,
      title: `${marker} Evening workout`,
      category: 'health',
      module: 'health',
      dueDate: addCalendarDays(today, -4),
      completedAt: addCalendarDays(today, -4),
      recurrence: 'weekly',
    },
  });

  await db.event.create({
    data: {
      responsibilityId: gym.id,
      fromState: 'UPCOMING',
      toState: 'COMPLETED',
      occurredAt: addCalendarDays(today, -4),
    },
  });

  for (let i = 0; i < 6; i++) {
    const ref = new Date(today.getFullYear(), today.getMonth() + i, 14, 12, 0, 0);
    await db.responsibility.create({
      data: {
        userId,
        personId: anchorPerson.id,
        title: `${marker} Planned EMI (${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')})`,
        category: 'finance',
        module: 'finance',
        dueDate: ref,
        amount: String(7600 + i * 450),
        recurrence: 'monthly',
      },
    });
  }
}

/**
 * Ensures freshly created or empty dashboards get believable placeholders (DB only — `DASHBOARD_DUMMY_SEED_MARKER` rows).
 * Skips whenever the user already has any responsibility.
 *
 * @param prisma Resolved Prisma client (usually `PrismaService`).
 * @param userId Authenticated user's id (`jwt.sub`).
 */
export async function ensureBareUserDashboardDummy(
  prisma: PrismaClient,
  userId: number,
): Promise<void> {
  if (
    typeof process.env.DISABLE_DASHBOARD_DUMMY_SEED === 'string' &&
    ['1', 'true', 'yes'].includes(process.env.DISABLE_DASHBOARD_DUMMY_SEED.trim().toLowerCase())
  ) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      'SELECT pg_advisory_xact_lock($1::int, $2::int)',
      DASHBOARD_SEED_LOCK_NS,
      userId,
    );

    const n = await tx.responsibility.count({ where: { userId } });
    if (n > 0) {
      return;
    }

    await insertDashboardDummyBundle(tx as unknown as DbLike, userId);
  });
}

/**
 * Wipes rows tagged {@link DASHBOARD_DUMMY_SEED_MARKER} then reapplies the dummy bundle (`npm run seed:dashboard`).
 *
 * @param prisma Resolved Prisma client.
 * @param userId Target user id.
 */
export async function reseedMarkedDashboardDummy(
  prisma: PrismaClient,
  userId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await wipeSeedArtifacts(tx as unknown as DbLike, userId);
    await insertDashboardDummyBundle(tx as unknown as DbLike, userId);
  });
}
