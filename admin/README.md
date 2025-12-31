# Flick Admin Portal

Minimal, clean admin portal for managing Flick MVP-0.

## Features

- **Dashboard**: View key metrics (users, surveys, answers, points)
- **Survey Management**: CRUD surveys and questions, toggle active/inactive
- **User Management**: View users, profiles, survey history, adjust points
- **Answers View**: Browse all survey responses with filtering
- **Simple Auth**: Password-protected access

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- tRPC (connected to backend)
- React Query

## Setup

1. **Install dependencies** (from project root):
```bash
pnpm install
```

2. **Create `.env.local` file**:
```bash
cd admin
cp .env.local.example .env.local
```

3. **Edit `.env.local`**:
```env
ADMIN_PASSWORD=your_secure_password_here
NEXT_PUBLIC_API_URL=http://localhost:4000
```

4. **Ensure backend is running**:
```bash
# From project root
pnpm dev:backend
```

5. **Start admin portal**:
```bash
# From project root
pnpm dev:admin

# Or from admin folder
pnpm dev
```

6. **Access admin portal**:
- Open http://localhost:3001
- Login with the password from `.env.local`

## Usage

### Dashboard
View high-level stats and active surveys.

### Surveys
- Create new surveys (guest or daily)
- Add questions with multiple choice options
- Toggle surveys active/inactive
- Edit survey details
- Delete surveys

### Users
- Search users by phone, name, or email
- View detailed user profiles
- See survey answer history
- Adjust user points (add or subtract)

### Answers
- View all survey responses
- Filter by survey
- See who answered what and when

## Security

- Simple password authentication via environment variable
- Token stored in localStorage
- All admin endpoints protected on backend
- For production: implement proper JWT + admin user management

## Development

```bash
# Type check
pnpm type-check

# Run in development
pnpm dev
```

## Notes

- Admin portal runs on port 3001 (backend on 4000)
- Uses same Prisma database as backend
- Lightweight, minimal design following .cursorrules
- No heavy dependencies, pure React + Tailwind

