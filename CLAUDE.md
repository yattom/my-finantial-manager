# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Autonomous Coding Workflow

When working autonomously on this project, follow this workflow:

### AI Decision-Making Guidelines

**Proceed Autonomously When:**
- Task is clearly defined in `docs/plan.md`
- Requirements are unambiguous
- Similar patterns exist in codebase
- Tests can verify correctness
- Changes are isolated and reversible

**Ask for Clarification When:**
- Multiple valid approaches exist with different tradeoffs
- Requirements are ambiguous or conflicting
- Breaking changes to existing APIs are needed
- Security or data integrity implications are unclear
- Task requires external dependencies or services

### Automatic Test-Driven Development

**MANDATORY: Always follow TDD workflow:**

1. **Before Implementation:**
   - Read and understand existing code
   - Identify relevant test files
   - Write failing tests that specify desired behavior
   - Run tests to confirm they fail for the right reason

2. **During Implementation:**
   - Write minimal code to pass tests
   - Run tests frequently (after each logical change)
   - Refactor while keeping tests green
   - Add edge case tests as you discover them

3. **Before Marking Complete:**
   - All tests must pass (unit + integration + e2e where applicable)
   - Code must pass linting (backend: black, isort, flake8, mypy; frontend: eslint)
   - No console errors or warnings in development
   - Changes are committed with clear messages

### Self-Verification Checklist

Before considering any task complete, verify:

- [ ] Tests written and passing
- [ ] Code follows existing patterns and style
- [ ] Linting passes with no errors
- [ ] No breaking changes to existing functionality (or documented if intentional)
- [ ] API changes reflected in both frontend and backend
- [ ] Database schema changes include migration strategy
- [ ] Documentation updated (inline comments, CLAUDE.md if patterns changed)
- [ ] `docs/plan.md` updated (mark task complete, add discovered issues)

### Error Recovery Protocol

**When Tests Fail:**
1. Read error messages carefully
2. Check if failure is expected (new failing test) or regression
3. Debug using relevant tools (console logs, debugger, test output)
4. If stuck after 3 attempts, document the blocker and ask for help
5. Never commit code with failing tests

**When Unexpected Errors Occur:**
1. Check service status (`docker-compose ps`)
2. Review recent changes that might have caused the issue
3. Check logs (backend: docker logs, frontend: browser console)
4. Attempt to reproduce in isolation
5. Revert changes if error is blocking and cause is unclear

## Task Execution Protocol

### Task Source of Truth

**Primary:** `docs/plan.md` contains all planned work organized by priority.

**Task Selection Logic:**
1. Start with "緊急（基本機能の完成）" (Emergency/Basic Function Completion)
2. Then proceed to "高優先度" (High Priority)
3. Only tackle "中優先度" (Medium) or "低優先度" (Low) if explicitly requested
4. Within priority levels, tackle tasks top-to-bottom unless dependencies require different order

### Definition of Done

**For Features:**
- [ ] Functionality implemented and working
- [ ] Unit tests cover new code (target: >80% coverage)
- [ ] E2E tests cover user workflows (if user-facing)
- [ ] Frontend and backend integrated (if applicable)
- [ ] Error handling implemented
- [ ] Edge cases handled
- [ ] Documentation updated

**For Bug Fixes:**
- [ ] Root cause identified and documented
- [ ] Test reproducing the bug added
- [ ] Fix implemented
- [ ] Test passes
- [ ] Regression tests confirm no new issues
- [ ] Related bugs checked (could be same root cause)

**For Refactoring:**
- [ ] All existing tests still pass
- [ ] Code quality improved (complexity, readability, maintainability)
- [ ] No behavior changes (unless intentional and documented)
- [ ] Performance not degraded (or improved if that was the goal)

### Code Quality Gates

**Must Pass Before Completion:**

**Backend:**
```bash
poetry run black . --check      # Code formatting
poetry run isort . --check      # Import sorting
poetry run flake8               # Linting
poetry run mypy .               # Type checking
poetry run pytest               # All tests
```

**Frontend:**
```bash
npm run lint                    # ESLint
npm test                        # Jest unit tests
npm run build                   # Production build succeeds
```

**Integration:**
```bash
docker-compose up -d            # Services start cleanly
cd frontend && npm run test:e2e # E2E tests pass
```

### Integration Testing Requirements

**Run Unit Tests When:**
- Changing a single function or component
- Quick feedback needed during development
- Debugging specific functionality

**Run Full Integration Tests When:**
- Completing a feature
- Changing API contracts
- Modifying database schema
- Before marking task complete
- Before committing to git

**Run E2E Tests When:**
- Completing user-facing features
- Changing navigation or workflows
- Modifying critical user paths
- Before marking high-priority tasks complete
- Before pushing to repository

## Git Commit Guidelines

### Commit Message Philosophy

**Write "WHY" not "WHAT":**
- Git diff shows WHAT changed - commit messages should explain WHY
- Focus on intent, context, and motivation behind changes
- Help future developers (including yourself) understand the reasoning

**Good Commit Messages:**
- ✅ "Enable autonomous AI coding workflow to reduce human intervention during development"
- ✅ "Optimize test execution by keeping Docker services running between test runs"
- ✅ "Prevent accidental destructive operations while allowing necessary development commands"

**Poor Commit Messages:**
- ❌ "Add autonomous coding workflow section to CLAUDE.md"
- ❌ "Update test-all command to not stop docker-compose"
- ❌ "Add settings.json with command allowlist"

### Commit Message Template

**IMPORTANT: Never use emojis in commit messages. This is a strict requirement.**

```
<Short summary of intent and impact>

<Optional: Additional context>
- Why this change is needed
- What problem it solves
- What tradeoffs were considered
- Any important context for future reference

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Examples

**Feature Implementation:**
```
Enable test-driven autonomous development workflow

Project needs to support AI-driven development with minimal human
intervention. Added workflow guidelines to ensure tests are written
first, code quality gates are enforced, and clear success criteria
are defined before marking work complete.
```

**Bug Fix:**
```
Fix test execution slowdown from repeated Docker restarts

Test iterations were slow due to starting/stopping services each run.
Modified /test-all to keep services running since they're needed for
multiple test runs during development anyway.
```

**Security/Safety:**
```
Restrict bash command execution to development operations only

Full wildcard (*) in allowed commands posed security risk (rm, ssh, etc).
Narrowed to specific development tools while blocking destructive and
remote operations to maintain safety during autonomous coding.
```

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
- Uses SQLite3 database with separate instances for different environments:
  - **`./data/financial_manager.db`**: Used by Docker containers (testing/E2E)
  - **`./backend/data/financial_manager.db`**: Used for local development

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
