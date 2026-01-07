FROM node:18-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files (including tsconfig.json)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./tsconfig.json
COPY shared ./shared
COPY backend ./backend

# Install dependencies from monorepo root
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/backend
RUN pnpm run postinstall

# Build backend (TypeScript compilation)
WORKDIR /app/backend
RUN pnpm build

# Start server (migrations run at startup via start script)
WORKDIR /app/backend
CMD ["pnpm", "start"]