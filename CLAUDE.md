# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Guidelines

When updating README.md or other user-facing documentation:

**DO:**
- Provide factual, actionable information
- Document what exists and how to use it
- Use clear, straightforward commands and instructions
- Keep content minimal and focused on what users need to know

**DON'T:**
- Add evaluative content ("comprehensive," "recommended," "better")
- Include subjective assessments or promotional language
- Add benefits/advantages lists unless specifically requested
- Include detailed metrics, test counts, or coverage statistics
- Use phrases like "推奨" (recommended), "利点" (advantages), etc.

**Example:**
- ❌ "このプロジェクトには包括的なテストスイートが含まれています"
- ✅ Just document the test commands

CLAUDE.md (this file) can include evaluative guidance for developers, but user-facing docs should remain objective.

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
docker-compose ps     # Check service status
```

### Testing and Quality

#### Unit Tests
- **Frontend Unit Tests (Jest)**: `cd frontend && npm test`
  - Currently configured with TypeScript support via ts-jest
  - Playwright E2E tests are excluded from Jest runs
  - Jest config: `frontend/jest.config.js`
- **Backend Tests (pytest)**: `cd backend && poetry run pytest`
- **Backend Linting**: `cd backend && poetry run black . && poetry run isort . && poetry run flake8 && poetry run mypy .`

#### E2E Testing with Playwright (Recommended Approach)

**The frontend includes comprehensive end-to-end tests** located in `frontend/tests/e2e/`:

**Setup (One-time):**
```bash
cd frontend
npm install              # Install Playwright dependencies
npx playwright install   # Install browser binaries
```

**Running E2E Tests - Docker Method (Recommended):**

This approach runs frontend and backend services in Docker containers, while Playwright tests run on the host machine:

```bash
# Step 1: Start services in Docker (from project root)
docker-compose up -d

# Verify services are running
docker-compose ps
# Backend should be at: http://localhost:8000
# Frontend should be at: http://localhost:3000

# Step 2: Run E2E tests from frontend directory
cd frontend
npm run test:e2e              # Run all tests, all browsers (headless)
npm run test:e2e:ui           # Interactive UI mode (recommended for development)
npm run test:e2e:headed       # Run with visible browser
npm run test:e2e -- --project=chromium  # Run only Chromium tests

# Step 3: Stop services when done
cd ..
docker-compose down
```

**Advantages of Docker Method:**
- ✅ Consistent environment (same as production)
- ✅ Isolated dependencies (no need to install backend tools on host)
- ✅ Fast test execution (Playwright runs natively on host)
- ✅ Easy debugging (can use Playwright UI mode and browser DevTools)
- ✅ Simple setup: just `docker-compose up -d` and run tests

**Alternative: Manual Service Start:**
```bash
# Terminal 1 - Backend
cd backend
poetry run uvicorn app.main:app --reload

# Terminal 2 - Frontend (auto-started by Playwright)
cd frontend
npm run test:e2e
```

**E2E Test Coverage:**
- Dashboard navigation and functionality
- Portfolio management and asset display
- Asset addition form and validation
- Performance analysis with charts and filters
- Price update functionality
- Complete user workflows and data persistence
- Error handling and edge cases
- **Total: 73 tests across 6 test files, running on 3 browsers (219 total test runs)**

**Playwright Configuration:**
- Auto-starts frontend dev server if not running
- Reuses existing server when available
- Captures screenshots on test failures
- Records videos on test failures
- Generates HTML reports with all failure artifacts

#### Pre-Push Testing Checklist

**IMPORTANT: Always run tests before pushing code to the repository**

```bash
# 1. Start services
docker-compose up -d

# 2. Run backend tests
cd backend && poetry run pytest

# 3. Run frontend unit tests
cd ../frontend && npm test

# 4. Run e2e tests
npm run test:e2e

# 5. Stop services
cd .. && docker-compose down

# Only push code after confirming all tests are green ✅
```

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
