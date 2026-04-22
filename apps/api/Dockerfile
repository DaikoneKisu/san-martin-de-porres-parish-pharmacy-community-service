FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies for the whole monorepo (workspaces need the root lockfile)
COPY package.json bunfig.toml bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/bcv-api/package.json ./packages/bcv-api/
COPY packages/contracts/package.json ./packages/contracts/

RUN bun install

# Copy source
COPY apps/api ./apps/api
COPY packages/bcv-api ./packages/bcv-api
COPY packages/contracts ./packages/contracts

# Generate Prisma client
RUN cd apps/api && bunx prisma generate

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
