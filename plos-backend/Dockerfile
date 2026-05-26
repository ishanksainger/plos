# PLOS API — NestJS + Prisma
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Replace the repo's prisma.config.ts with a slimmed version that reads
# DATABASE_URL straight from process.env. The original imports
# 'dotenv/config' which only reads from a .env file — process.env values
# set by docker-compose are invisible to it. Prisma 7 deprecated `url`
# in schema.prisma so the config file is the only place it can live.
RUN cat > prisma.config.ts <<'EOF'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
EOF

# prisma generate doesn't connect; dummy URL is enough.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Runtime needs: built JS, node_modules, prisma client, migrations, uploads dir.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/uploads

EXPOSE 3001
# With prisma.config.ts removed and schema.prisma reading env("DATABASE_URL"),
# the standard Prisma flow picks up DATABASE_URL from process.env on its own.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
