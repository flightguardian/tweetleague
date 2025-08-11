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

## Important Components

### Admin Components (`components/admin/`)
- `score-updater.tsx` - Production score submission interface
- `fixture-manager.tsx` - Manage fixtures
- `season-manager.tsx` - Manage seasons

### Admin Pages (`app/admin/`)
- `/admin` - Main admin dashboard
- `/admin/test-scores` - Test score simulation with undo

## API Integration
- API client: `lib/api.ts`
- Base URL configured in environment
- Auth token added to requests via NextAuth session

## Authentication Flow
1. User logs in via `/auth` page
2. Creates account or logs in with email/password
3. Can also authenticate via Twitter OAuth
4. Email verification required before making predictions

## Key Features
- Leaderboard ordering: Active players (predictions_made > 0) always rank above inactive
- Only next upcoming fixture can be predicted
- Deadline: 5 minutes before kickoff
- Points shown after fixture completes

## Deployment
- Manual deployment required
- Build: `npm run build`
- Start: `npm start`

## Environment Variables
Check `.env.local` for:
- API URL
- NextAuth configuration
- Twitter OAuth credentials