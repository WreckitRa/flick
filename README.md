# 🎯 Flick - Gamified Daily Survey App

Flick is a gamified mobile survey application built with React Native (Expo) and a Node.js backend. Users earn Flick Coins by completing daily surveys and can redeem them for rewards.

## 🏗️ Architecture

This is a **pnpm monorepo** with the following structure:

```
flick/
├── mobile/          # Expo React Native app
├── backend/         # Node.js + tRPC API server
├── prisma/          # Database schema & migrations
├── shared/          # Shared types between frontend/backend
└── package.json     # Root workspace configuration
```

## 🚀 Tech Stack

### Mobile App
- **Framework**: Expo (React Native)
- **Routing**: Expo Router (file-based)
- **API Client**: tRPC + React Query
- **Auth**: Firebase Phone Authentication
- **Storage**: Expo SecureStore
- **Analytics**: PostHog
- **Animations**: React Native Reanimated + Lottie

### Backend
- **Runtime**: Node.js + TypeScript
- **API**: tRPC (type-safe RPC)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Firebase Admin SDK
- **Deployment**: Vercel-ready

### Database
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Models**: User, Survey, Question, UserAnswer, UserPoint

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL
- Firebase project (for authentication)

### 1. Clone and Install

```bash
cd flick
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/flick?schema=public"

# Firebase Admin SDK (Backend)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"

# Backend
PORT=3000
NODE_ENV=development

# Mobile App (Expo)
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_POSTHOG_API_KEY="your-posthog-key"
EXPO_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# Firebase Client (Mobile)
EXPO_PUBLIC_FIREBASE_API_KEY="your-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
EXPO_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. Database Setup

```bash
# Run migrations
pnpm db:migrate

# Seed the database with initial surveys
pnpm db:seed
```

## 🎮 Development

Run all services in separate terminals:

### Terminal 1: Backend
```bash
pnpm dev:backend
```

### Terminal 2: Mobile App
```bash
pnpm dev:mobile
```

The backend will run on `http://localhost:3000` and the mobile app will start with Expo.

## 📱 App Flow

1. **Onboarding** (3 screens)
   - Welcome
   - How it works
   - Get started

2. **Guest Survey** (Before signup)
   - Complete survey without account
   - Earn 20 Flick Coins
   - Prompted to sign up to save coins

3. **Signup/Auth**
   - Phone OTP verification
   - Profile completion
   - Firebase authentication

4. **Home Screen**
   - Greeting + stats (streak, coins)
   - Daily survey card
   - Quick actions
   - Insights

5. **Daily Survey**
   - Answer questions one by one
   - Progress bar
   - Coin animations
   - +10 coins per survey

6. **Rewards** (Coming soon)
   - Balance display
   - Reward categories placeholder
   - Redemption (future feature)

7. **Profile**
   - User info
   - Stats (coins, surveys, streak)
   - Points history
   - Survey history
   - Logout / Delete account

## 🔌 API Routes

### Auth Router (`/auth`)
- `requestOtp` - Request OTP for phone number
- `verifyOtp` - Verify OTP and create/login user
- `signup` - Complete user profile

### Survey Router (`/survey`)
- `getGuestSurvey` - Get guest survey (public)
- `getDailySurvey` - Get daily survey (protected)
- `submitGuestSurvey` - Submit guest answers
- `submitDailySurvey` - Submit daily answers + award points
- `getSurveyHistory` - Get user's survey history

### User Router (`/user`)
- `getProfile` - Get user profile + stats
- `updateProfile` - Update user info
- `getPoints` - Get points history
- `deleteAccount` - Delete user account

### Insights Router (`/insights`)
- `getInsights` - Get personalized insights based on answers

## 🎨 Design System

### Colors
- **Primary Yellow**: `#FFD93D`
- **Primary Blue**: `#4B6FFF`
- **Background**: `#FFFFFF`
- **Text**: `#000000`, `#666666`, `#999999`
- **Gray**: `#F8F8F8`, `#E5E5E5`

### Typography
- **Large Title**: 36px, bold
- **Title**: 28-32px, bold
- **Subtitle**: 18-20px, regular
- **Body**: 16px, regular
- **Caption**: 14px, regular

### Components
- Rounded corners (12-20px border radius)
- Soft shadows
- Duolingo-inspired animations
- Emoji-rich UI
- High contrast

## 📊 Analytics Events

PostHog tracks the following events:

- `app_opened`
- `onboarding_completed`
- `guest_survey_started`
- `guest_survey_completed`
- `signup_started`
- `signup_completed`
- `daily_survey_started`
- `daily_survey_completed`
- `reward_page_viewed`
- `profile_viewed`

## 🗄️ Database Schema

### User
- id, phone, name, email, gender, nationality, area, dob
- Relations: answers, points

### Survey
- id, title, type (guest/daily), active
- Relations: questions

### Question
- id, surveyId, text, type, options (JSON)
- Relations: survey, answers

### UserAnswer
- id, userId, questionId, answer
- Relations: user, question

### UserPoint
- id, userId, amount, reason, createdAt
- Relations: user

## 🚢 Deployment

### Backend (Vercel)
```bash
cd backend
vercel
```

### Mobile (EAS Build)
```bash
cd mobile
eas build --platform ios
eas build --platform android
```

## 🔐 Security Notes

- Firebase Admin SDK validates tokens server-side
- Secure storage for auth tokens on mobile
- Protected tRPC procedures require authentication
- CORS enabled for specified origins only (configure in production)

## 🧪 MVP-0 Status

This is an **MVP-0** release with:

✅ Full working authentication flow  
✅ Guest survey (pre-signup)  
✅ Daily survey system  
✅ Points & rewards system (placeholder)  
✅ Profile & history  
✅ Analytics tracking  
✅ Gamified UI with animations  

🚧 Coming Soon:
- Actual reward redemption
- Advanced insights
- Push notifications
- Streak bonuses
- Social features

## 📝 Scripts Reference

```bash
# Install all dependencies
pnpm install

# Development
pnpm dev:mobile          # Start Expo dev server
pnpm dev:backend         # Start backend server

# Database
pnpm db:migrate          # Run Prisma migrations
pnpm db:seed             # Seed database with surveys
pnpm db:push             # Push schema without migration
pnpm db:studio           # Open Prisma Studio

# Type checking
pnpm type-check          # Check TypeScript in all packages
```

## 🤝 Contributing

This is an MVP. For production:
1. Replace dummy Firebase tokens with real implementation
2. Add proper error boundaries
3. Implement rate limiting
4. Add request validation
5. Set up proper CI/CD
6. Add E2E tests
7. Implement actual reward redemption logic
8. Add push notifications

## 📄 License

Proprietary - All rights reserved

---

Built with ❤️ for MVP-0 rapid development


