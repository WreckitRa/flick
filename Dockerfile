FROM node:18-alpine

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY backend ./backend

# Install dependencies from monorepo root
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/backend
RUN pnpm run postinstall

# Build backend
RUN pnpm build

# Run migrations
RUN pnpm run migrate:deploy

# Start server
WORKDIR /app/backend
CMD ["node", "dist/index.js"]