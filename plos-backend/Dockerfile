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

# Overwrite the repo's dotenv-based prisma.config.ts with a process.env
# variant — see prisma.config.docker.ts header for the why.
RUN cp prisma.config.docker.ts prisma.config.ts

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
