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

# Patch schema.prisma to read url from env(), and remove prisma.config.ts
# so the standard Prisma flow (schema-only datasource) is used. The
# prisma.config.ts that ships in the repo reads DATABASE_URL via dotenv
# only — it ignores docker-compose env vars — which broke migrate at
# container boot.
RUN sed -i 's|^\s*provider = "postgresql"|  provider = "postgresql"\n  url      = env("DATABASE_URL")|' prisma/schema.prisma \
 && rm -f prisma.config.ts

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
