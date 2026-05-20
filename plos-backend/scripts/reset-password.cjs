/**
 * Set a new password for an existing user (local / self-hosted recovery).
 *
 * Usage (from plos-backend, with .env containing DATABASE_URL):
 *   node scripts/reset-password.cjs <email> <new-password>
 *
 * Does not print the old password (it cannot be recovered from the DB).
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-password.cjs <email> <new-password>');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters (same rule as registration).');
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Run from plos-backend with a configured .env');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const res = await client.query(
      'UPDATE "User" SET "passwordHash" = $1 WHERE LOWER(email) = LOWER($2)',
      [hash, email],
    );
    if (res.rowCount === 0) {
      console.error(`No user found with email: ${email}`);
      console.error('Tip: run `npx prisma studio` → User table to see stored emails.');
      process.exit(1);
    }
    console.log(`Password updated for ${email}. You can log in with the new password.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
