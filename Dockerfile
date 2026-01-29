# ---------- Builder ----------
FROM node:22-alpine AS builder

# Build tools for native dependencies
RUN apk add --no-cache libc6-compat openssl

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Nuxt
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN pnpm build

# ---------- Runner ----------
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Files needed for drizzle-kit (db:push at startup)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/server/database ./server/database

# Nuxt build output
COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Run database migrations and start server
CMD sh -c "pnpm db:push && node .output/server/index.mjs"
