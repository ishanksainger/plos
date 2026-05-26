# PLOS frontend — Vite + Mantine SPA, served by nginx.
# Built from the monorepo root so the @nis/ui workspace dep resolves.
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

# Copy workspace manifests first for cacheable npm install.
COPY package.json package-lock.json ./
COPY plos-frontend/package.json ./plos-frontend/
COPY packages/brand-tokens/package.json ./packages/brand-tokens/
COPY packages/ui/package.json ./packages/ui/
COPY packages/razorpay-sdk/package.json ./packages/razorpay-sdk/
COPY apps/web/package.json ./apps/web/

RUN npm install

# Copy source for plos-frontend + workspace packages it consumes.
COPY plos-frontend ./plos-frontend
COPY packages ./packages

WORKDIR /repo/plos-frontend

# VITE_API_BASE_URL is empty so the bundle calls same-origin `/api/*`.
# Traefik (in /docker/plos/docker-compose.yml) routes `/api/*` to the
# plos-backend container at port 3001.
ENV VITE_API_BASE_URL=""
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /repo/plos-frontend/dist /usr/share/nginx/html
COPY plos-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
