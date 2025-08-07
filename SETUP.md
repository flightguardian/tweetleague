# Coventry City Prediction League - Setup Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Git

## Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE predictionleague;
CREATE USER predictionuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE predictionleague TO predictionuser;
\q
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run database migrations
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Start backend server
uvicorn main:app --reload
```

Backend will be running at http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
# Edit .env.local if needed (default values should work)

# Start development server
npm run dev
```

Frontend will be running at http://localhost:3000

## Configuration

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key (generate a secure random string)
- `FOOTBALL_API_KEY`: Get from https://www.football-data.org/
- `RESEND_API_KEY`: Get from https://resend.com/ for email notifications

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000/api)
- `NEXTAUTH_SECRET`: NextAuth secret key

## Creating Admin User

1. Register a normal user through the frontend
2. Access PostgreSQL:
```bash
sudo -u postgres psql -d predictionleague
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
\q
```

## Importing Fixtures

### Option 1: Manual Entry
- Login as admin
- Navigate to /admin
- Add fixtures manually

### Option 2: API Import
- Get API key from football-data.org
- Add to backend .env
- Use admin panel's "Import Fixtures" button

## Deployment

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect Railway/Render to GitHub repo
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in .env
- Check database exists: `psql -U postgres -l`

### Frontend API Connection
- Ensure backend is running
- Check CORS settings in backend
- Verify API URL in .env.local

### Missing Dependencies
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`

## Support
For issues, please check the project documentation or create an issue on GitHub.