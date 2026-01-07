FROM node:18-slim

# Install OpenSSL (if needed for any dependencies)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./tsconfig.json
COPY shared ./shared
COPY admin ./admin

# Install dependencies from monorepo root
RUN pnpm install --frozen-lockfile

# Build Next.js app
WORKDIR /app/admin
RUN pnpm build

# Start Next.js server
WORKDIR /app/admin
CMD ["pnpm", "start"]