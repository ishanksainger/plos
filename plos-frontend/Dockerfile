# PLOS frontend — Vite + Mantine SPA, served by nginx.
# Built from the monorepo root so the @nis/ui workspace dep resolves.
# NOTE: plos-frontend lives next to apps/* but is NOT in the root npm
# workspaces glob, so we install workspace deps (for @nis/ui resolution)
# then npm-install plos-frontend's own deps separately.
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

# Root + workspace manifests for cacheable workspace install.
COPY package.json package-lock.json ./
COPY packages/brand-tokens/package.json ./packages/brand-tokens/
COPY packages/ui/package.json ./packages/ui/
COPY packages/razorpay-sdk/package.json ./packages/razorpay-sdk/
COPY apps/web/package.json ./apps/web/

RUN npm install

# Workspace package sources (so @nis/ui has files to resolve to).
COPY packages ./packages

# Now install plos-frontend's own deps. Symlink the workspace packages
# into plos-frontend/node_modules so its imports of @nis/ui resolve.
COPY plos-frontend/package.json ./plos-frontend/
WORKDIR /repo/plos-frontend
RUN npm install \
 && mkdir -p node_modules/@nis \
 && ln -sf /repo/packages/ui          node_modules/@nis/ui \
 && ln -sf /repo/packages/brand-tokens node_modules/@nis/brand-tokens

# Now copy plos-frontend source and build.
COPY plos-frontend ./

# VITE_API_BASE_URL is empty so the bundle calls same-origin `/api/*`.
# Traefik (in docker-compose.plos.yml) routes `/api/*` to the
# plos-backend container at port 3001.
ENV VITE_API_BASE_URL=""
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /repo/plos-frontend/dist /usr/share/nginx/html
COPY plos-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
