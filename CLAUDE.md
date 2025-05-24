# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment Setup

### Prerequisites
1. Install Poetry for Python dependency management:
```bash
pip install poetry
```

2. Ensure Node.js and npm are installed for frontend development.

### Initial Setup
1. Install backend dependencies:
```bash
cd backend
poetry install
mkdir -p data  # Create directory for SQLite database
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Development Commands

### Local Development
**Frontend (Next.js):**
```bash
cd frontend
npm run dev  # Starts development server on http://localhost:3000
npm run build  # Build for production
npm run lint  # ESLint checks
npm test -- --passWithNoTests  # Run Jest tests (currently no test files)
```

**Backend (FastAPI):**
```bash
cd backend
poetry run uvicorn app.main:app --reload  # Starts API server on http://localhost:8000
poetry run pytest  # Run tests
poetry run black .  # Format code
poetry run isort .  # Sort imports
poetry run flake8  # Linting
poetry run mypy .  # Type checking
```

### Docker Development
```bash
docker-compose up -d  # Start both services
docker-compose down  # Stop services
```

### Testing and Quality
- Frontend: `npm test` for Jest tests
- Backend: `poetry run pytest` for Python tests
- Backend linting: `poetry run black . && poetry run isort . && poetry run flake8 && poetry run mypy .`

**IMPORTANT: Always run tests before pushing code to the repository**
- Run `cd backend && poetry run pytest` to verify backend tests pass
- Run `cd frontend && npm test` to verify frontend tests pass
- Only push code after confirming all tests are green

## Architecture Overview

This is a personal financial asset management system built with a React/Next.js frontend and FastAPI backend.

### Backend Architecture (FastAPI + SQLAlchemy)
- **main.py**: FastAPI application with CORS middleware and API endpoints
- **models.py**: SQLAlchemy ORM models for Asset and PriceHistory tables
- **schemas.py**: Pydantic models for request/response validation
- **crud.py**: Database operations layer (CRUD functions)
- **database.py**: SQLAlchemy database connection and session management
- Uses SQLite3 database stored in `/app/data` volume

### Frontend Architecture (Next.js + TypeScript)
- **Pages Router**: Uses Next.js pages directory structure
- **Key Pages**:
  - `/`: Dashboard with navigation to main features
  - `/portfolio`: Portfolio overview with asset summary and allocation charts
  - `/performance`: Performance analysis with date range selection and charts
  - `/assets/add`: Asset addition form
  - `/prices/update`: Price update functionality
- **Components**: Uses Recharts for data visualization (PieChart, LineChart)
- **State Management**: Local React state with axios for API calls
- **UI**: Custom CSS classes (globals.css) with utility-based styling

### Data Flow
- Frontend makes HTTP requests to backend API endpoints
- Backend uses SQLAlchemy ORM to interact with SQLite database
- Price data fetching uses yfinance library for real-time market data
- Docker Compose connects frontend/backend with volume mounts for development

### Key Features
- Asset portfolio tracking (stocks, mutual funds, ETFs)
- Real-time price updates via yfinance
- Performance analysis with time-series charts
- Asset allocation visualization
- Historical price tracking

## API Structure

The backend exposes RESTful endpoints:
- `GET /assets` - Get all assets with summary
- `POST /assets` - Create new asset
- `GET /assets/{id}` - Get specific asset
- `PUT /assets/{id}` - Update asset
- `DELETE /assets/{id}` - Delete asset
- `POST /prices/update` - Update asset prices
- `GET /performance` - Get performance data for date range

## Development Notes

- API documentation available at http://localhost:8000/docs (Swagger) and http://localhost:8000/redoc
- Backend uses async/await patterns with SQLAlchemy async operations
- Frontend includes fallback dummy data for development when API calls fail
- Code is primarily commented in Japanese as this is a Japanese financial management system