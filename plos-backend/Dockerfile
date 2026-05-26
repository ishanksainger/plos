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
# prisma.config.ts dereferences DATABASE_URL at load time. `prisma generate`
# doesn't actually connect, so a dummy value satisfies the config check.
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
# prisma.config.ts uses `import 'dotenv/config'` and `env('DATABASE_URL')`,
# which reads only from a `.env` file — process.env values set by the
# container runtime aren't visible at config evaluation. Write one from
# the live env vars before running migrate + start.
CMD ["sh", "-c", "printf 'DATABASE_URL=%s\\nJWT_SECRET=%s\\nJWT_EXPIRES_IN=%s\\nPLOS_APP_URL=%s\\nPORT=%s\\nNODE_ENV=%s\\n' \"$DATABASE_URL\" \"$JWT_SECRET\" \"$JWT_EXPIRES_IN\" \"$PLOS_APP_URL\" \"$PORT\" \"$NODE_ENV\" > .env && npx prisma migrate deploy && node dist/main"]
