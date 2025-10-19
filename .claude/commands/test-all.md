# Test All

Run the complete test suite for the financial manager application.

Execute the following steps in order:

1. **Check/Start Services**: Ensure Docker services are running
   - Check service status with `docker-compose ps` from the project root
   - If services are not running, start them with `docker-compose up -d`
   - Wait for services to be ready (backend on :8000, frontend on :3000)
   - **Do NOT stop services** - leave them running for faster subsequent test runs

2. **Backend Tests**: Run all backend tests and quality checks
   - Navigate to `backend/` directory
   - Run `poetry run pytest` - all tests must pass
   - Run `poetry run black . --check` - formatting check
   - Run `poetry run isort . --check` - import sorting check
   - Run `poetry run flake8` - linting check
   - Run `poetry run mypy .` - type checking

3. **Frontend Unit Tests**: Run Jest tests
   - Navigate to `frontend/` directory
   - Run `npm test` - all unit tests must pass
   - Run `npm run lint` - ESLint check
   - Run `npm run build` - ensure production build succeeds

4. **E2E Tests**: Run Playwright end-to-end tests
   - From `frontend/` directory
   - Run `npm run test:e2e` - all E2E tests must pass across all browsers

5. **Report Results**: Provide a summary of all test results
   - List any failures with details
   - Confirm if all tests passed
   - If any failures, suggest next steps for debugging
   - Note: Services are still running for faster subsequent test runs

**IMPORTANT**:
- Stop execution and report immediately if any test fails
- Do not proceed to next steps if critical failures occur
- Provide clear error messages and suggest fixes
- **Leave Docker services running** - they will be reused for faster testing
