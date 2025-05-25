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
- Frontend Unit Tests: `npm test` for Jest tests
- Frontend E2E Tests: `npm run test:e2e` for Playwright tests
- Backend: `poetry run pytest` for Python tests
- Backend linting: `poetry run black . && poetry run isort . && poetry run flake8 && poetry run mypy .`

**IMPORTANT: Always run tests before pushing code to the repository**
- Run `cd backend && poetry run pytest` to verify backend tests pass
- Run `cd frontend && npm test` to verify frontend unit tests pass
- Run `cd frontend && npm run test:e2e` to verify e2e tests pass
- Only push code after confirming all tests are green

### E2E Testing with Playwright
The frontend includes comprehensive end-to-end tests located in `frontend/tests/e2e/`:

**Prerequisites for E2E tests:**
```bash
cd frontend
npm install  # Install Playwright
npx playwright install  # Install browsers
```

**Running E2E tests:**
```bash
cd frontend
npm run test:e2e          # Run all e2e tests headless
npm run test:e2e:ui       # Run with interactive UI (recommended for development)
npm run test:e2e:headed   # Run with visible browser
```

**E2E Test Coverage:**
- Dashboard navigation and functionality
- Portfolio management and asset display
- Asset addition form and validation
- Performance analysis with charts and filters
- Price update functionality
- Complete user workflows and data persistence
- Error handling and edge cases

**Note:** E2E tests require both frontend and backend services to be running. Use `docker-compose up -d` or start services manually before running tests.

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

## Testing and Discovery Workflow

### Manual Testing via Playwright MCP
When exploring functionality or investigating issues, use this workflow:

1. **Operate the app via Playwright MCP**
   ```bash
   # Start the browser automation
   mcp__playwright__browser_navigate to http://localhost:3000
   mcp__playwright__browser_click on elements
   mcp__playwright__browser_take_screenshot for documentation
   ```

2. **Find something interesting/problematic**
   - UI behavior that doesn't match expectations
   - Missing functionality
   - Performance issues
   - Data validation gaps

3. **Research how it's handled in the code**
   - Use Grep/Glob tools to find relevant files
   - Read the implementation to understand current behavior
   - Identify root causes or missing implementations

4. **Take notes and document findings**
   - Document the discovery in comments or markdown
   - Identify what should be improved or implemented

5. **Update TODO in docs/plan.md**
   - Add specific actionable items to the appropriate priority section
   - Include context about current state vs. desired state
   - Note any technical blockers or dependencies

### Example Workflow Applied
This workflow was used to discover the time period data validation gap:
1. **Operated** performance page via Playwright MCP
2. **Found** that time period buttons work but data doesn't visibly change
3. **Researched** the frontend code to understand current implementation
4. **Noted** the gap between UI functionality and business logic validation
5. **Updated** plan.md with specific TODO for data validation testing

### Benefits of This Workflow
- **Systematic discovery**: Ensures issues are properly investigated
- **Documentation**: Creates audit trail of discoveries and decisions
- **Actionable outcomes**: Converts discoveries into planned work
- **Knowledge retention**: Preserves understanding for future development