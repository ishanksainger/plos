# NIS marketing site — production Dockerfile
# Built from the monorepo root so npm workspaces can resolve @nis/* deps.

FROM node:20-bookworm-slim
WORKDIR /app

# Install package manifests first for Docker layer caching.
# Any change to source code below this layer will reuse the deps install.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/brand-tokens/package.json ./packages/brand-tokens/
COPY packages/ui/package.json ./packages/ui/
COPY packages/razorpay-sdk/package.json ./packages/razorpay-sdk/

RUN npm install

# Copy source.
COPY apps/web ./apps/web
COPY packages ./packages
COPY tsconfig*.json ./

# Build Next.js production bundle.
RUN npm run build --workspace=apps/web

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/web
CMD ["npm", "run", "start"]
