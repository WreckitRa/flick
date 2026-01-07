FROM node:18-slim

# Install OpenSSL (if needed for any dependencies)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only what admin needs (skip backend to avoid Prisma)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./tsconfig.json
COPY shared ./shared
COPY admin ./admin

# Set dummy DATABASE_URL to prevent Prisma errors during install
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Install only admin and shared dependencies
RUN pnpm install --filter @flick/admin --filter @flick/shared --frozen-lockfile

# Build Next.js app
WORKDIR /app/admin
RUN pnpm build

# Start Next.js server
WORKDIR /app/admin
CMD ["pnpm", "start"]