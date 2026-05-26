# PLOS frontend — Vite + Mantine SPA, served by nginx.
# Built from the monorepo root so the @nis/* workspace deps resolve.
#
# plos-frontend lives next to apps/* and packages/* but is NOT in the
# root package.json workspaces glob. We patch the workspaces array in
# the build image only (NOT committed to the repo) so a single
# `npm install` at root picks up plos-frontend's deps via npm
# workspaces — which is the only way `"@nis/ui": "*"` resolves without
# hitting the public registry.
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

# Source files needed by `npm install` (manifests + workspace package
# sources, since @nis/ui resolves to packages/ui via workspaces).
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages
COPY plos-frontend/package.json ./plos-frontend/

# Patch the root manifest to include plos-frontend in workspaces, then
# do a fresh install (no lockfile so workspace topology changes are OK).
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.workspaces=Array.from(new Set([...(p.workspaces||[]),'plos-frontend']));fs.writeFileSync('package.json',JSON.stringify(p,null,2));" \
 && rm -f package-lock.json \
 && npm install --no-audit --no-fund

# Copy plos-frontend source and build.
COPY plos-frontend ./plos-frontend
WORKDIR /repo/plos-frontend

# VITE_API_BASE_URL is empty so the bundle calls same-origin `/api/*`.
# Traefik routes `/api/*` to the plos-backend container.
ENV VITE_API_BASE_URL=""
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /repo/plos-frontend/dist /usr/share/nginx/html
COPY plos-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
