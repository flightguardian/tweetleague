# Frontend - Prediction League UI

## Development Setup
```bash
npm install
npm run dev
# Runs on http://localhost:3000
```

## Key Technologies
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- NextAuth for authentication
- React Hook Form for form management
- Lucide React for icons

## Important Components

### Core Components
- `prediction-card.tsx` - Main prediction card for upcoming fixtures
- `mini-league-modal.tsx` - Create/join mini league modal
- `email-verification-modal.tsx` - Email verification prompt
- `top-leaderboard.tsx` - Top 5 leaderboard display
- `recent-results.tsx` - Recent match results
- `manager-of-month.tsx` - Monthly top performer

### Admin Components (`components/admin/`)
- `score-updater.tsx` - Production score submission interface
- `fixture-manager.tsx` - Manage fixtures
- `season-manager.tsx` - Manage seasons

## Key Pages

### Public Pages
- `/` - Homepage with next fixture prediction
- `/auth` - Login/Register page
- `/leaderboard` - Main league table with mini league support
- `/predictions` - User's predictions history
- `/predictions/fixture/[id]` - All predictions for a specific fixture
- `/how-it-works` - Game rules and instructions

### Admin Pages (`app/admin/`)
- `/admin` - Main admin dashboard
- `/admin/test-scores` - Test score simulation with undo

## API Integration
- API client: `lib/api.ts`
- Base URL configured in environment
- Auth token added to requests via NextAuth session
- Error handling with toast notifications

## Authentication Flow
1. User logs in via `/auth` page
2. Creates account or logs in with email/password
3. Can also authenticate via Twitter OAuth
4. Email verification required before making predictions
5. Session managed by NextAuth

## Key Features
- **Leaderboard**: Pre-calculated positions with tie handling
- **Mini Leagues**: Create/join with 8-character invite codes
- **Predictions**: Deadline 5 minutes before kickoff
- **Points**: 3 for perfect score, 1 for correct result
- **Responsive Design**: Mobile-first approach
- **Real-time Countdowns**: Live countdown to prediction deadline

## UI/UX Improvements
- Submission timestamps shown on all devices
- Mini league modal accessible from homepage
- Stable pagination with username tiebreaker
- Toast notifications for user feedback
- Loading states and error boundaries

## Deployment
- Manual deployment required
- Build: `npm run build`
- Start: `npm start`
- Lint check: `npm run lint`
- Type check: `npm run typecheck`

## Environment Variables
Check `.env.local` for:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXTAUTH_URL` - NextAuth base URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `TWITTER_CLIENT_ID` - Twitter OAuth ID
- `TWITTER_CLIENT_SECRET` - Twitter OAuth secret