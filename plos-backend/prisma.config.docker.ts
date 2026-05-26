// Docker-only Prisma config. The repo's prisma.config.ts uses dotenv and
// only reads from a .env file on disk, which doesn't work in containers
// where DATABASE_URL is set by docker-compose's environment block. This
// file is copied over the repo one inside the image (see plos-backend/
// Dockerfile) so prisma reads DATABASE_URL straight from process.env.
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
