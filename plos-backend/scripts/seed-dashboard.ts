import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  DASHBOARD_DUMMY_SEED_MARKER,
  reseedMarkedDashboardDummy,
} from '../src/user/dashboard-dummy-seed';

function bootstrapEnv(): void {
  loadEnv({ path: resolve(__dirname, '../.env') });
  loadEnv({ path: resolve(__dirname, '../.env.local'), override: true });
}

bootstrapEnv();

async function main(): Promise<void> {
  const emailRaw = process.argv[2] || process.env.SEED_EMAIL;
  if (!emailRaw || typeof emailRaw !== 'string' || emailRaw.trim() === '') {
    console.error(
      'Usage: npm run seed:dashboard -- <email>\nOr set SEED_EMAIL in `.env` (required for `npx prisma db seed`).',
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Configure plos-backend/.env first.');
    process.exit(1);
  }

  const email = emailRaw.trim();
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user with email "${email}". Register first, then rerun.`);
      process.exit(1);
    }

    await reseedMarkedDashboardDummy(prisma, user.id);
    const totalSeed = await prisma.responsibility.count({
      where: { userId: user.id, title: { startsWith: DASHBOARD_DUMMY_SEED_MARKER } },
    });
    console.log(
      `Dashboard seed OK for "${email}". ${totalSeed} markers + EMI series (${DASHBOARD_DUMMY_SEED_MARKER}). Refresh the SPA.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
