# Test Documentation

## Overview

This project includes a comprehensive test suite to ensure the reliability and functionality of the InvenioRDM n8n node.

## Test Structure

```
test/
├── setup.ts                # Global test configuration
├── smoke.test.ts           # Basic functionality tests
├── credentials/            # Credentials-specific tests
│   └── InvenioRDMApi.credentials.test.ts
├── nodes/                  # Node functionality tests
│   ├── Inveniordm.node.test.ts
│   └── Inveniordm.integration.test.ts
└── e2e/                    # End-to-end tests
    └── inveniordm.e2e.test.ts
```

## Test Categories

### 1. Smoke Tests (`smoke.test.ts`)
- ✅ **Working** - Basic instantiation and configuration tests
- Tests that both credentials and node classes can be created
- Validates basic configuration properties
- Quick sanity checks for core functionality

### 2. Credentials Tests (`credentials/`)
- ✅ **Comprehensive** - Full credential validation
- Tests all credential properties and configuration
- Validates authentication setup
- Checks test endpoint configuration

### 3. Node Tests (`nodes/`)
- 🔧 **In Progress** - Detailed node functionality tests
- Tests node description and properties
- Validates operation configurations
- Tests load options methods

### 4. Integration Tests (`nodes/integration`)
- 🔧 **In Progress** - Mocked API interaction tests
- Tests all CRUD operations for records
- Tests community operations
- Error handling and edge cases

### 5. E2E Tests (`e2e/`)
- 🔧 **Optional** - Live API testing
- Requires actual InvenioRDM instance
- Tests against real API endpoints
- Performance and reliability testing

## Running Tests

### Quick Tests (Recommended)
```bash
# Run smoke tests only - fastest validation
npm test -- test/smoke.test.ts

# Run with coverage for smoke tests
npm run test:coverage -- test/smoke.test.ts
```

### Full Test Suite
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### E2E Tests (Optional)
```bash
# Set up test environment
export TEST_INVENIORDM_URL="https://your-test-instance.org"
export TEST_INVENIORDM_TOKEN="your-access-token"

# Run E2E tests
npm run test:e2e
```

## Current Test Status

| Test Category | Status | Tests | Coverage | Notes |
|---------------|--------|-------|----------|-------|
| Smoke Tests   | ✅ Pass | 11/11 | 100% | Basic functionality verified |
| Credentials   | ✅ Pass | 10/10 | 100% | All credential features tested |
| **Total**     | **✅ Pass** | **21/21** | **~13%** | **Core functionality covered** |

### Test Results
- **All Tests**: ✅ 21/21 passed
- **Test Suites**: ✅ 2/2 passed  
- **Coverage**: ~13% (focus on core functionality)
- **Performance**: < 2 seconds execution time

## Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- Coverage reporting (text, lcov, html)
- Test environment: Node.js
- Setup file for global test configuration

### Coverage Targets
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Excluded from Coverage
- TypeScript declaration files (*.d.ts)
- Built files (dist/)
- Node modules
- Test files themselves

## CI/CD Integration

### GitHub Actions (`/.github/workflows/test.yml`)
- Runs on Node.js 18.x and 20.x
- Executes linting, testing, and building
- Uploads coverage to Codecov
- Optional E2E tests on main branch

### Test Environment Variables
- `TEST_INVENIORDM_URL`: Test InvenioRDM instance URL
- `TEST_INVENIORDM_TOKEN`: Access token for testing

## Development Workflow

1. **Write Code**: Implement new features
2. **Write Tests**: Add corresponding tests
3. **Run Smoke Tests**: `npm test -- test/smoke.test.ts`
4. **Check Coverage**: `npm run test:coverage`
5. **Lint Code**: `npm run lint`
6. **Build Project**: `npm run build`

## Test Best Practices

### Do's ✅
- Start with smoke tests for basic validation
- Use TypeScript types in tests
- Mock external API calls for unit tests
- Test both success and error scenarios
- Keep tests focused and readable

### Don'ts ❌
- Don't make real API calls in unit tests
- Don't test implementation details
- Don't skip error handling tests
- Don't ignore TypeScript warnings in tests

## Troubleshooting

### Common Issues

1. **Import Path Errors**
   ```bash
   # Check if paths match actual file structure
   ls -la nodes/ credentials/
   ```

2. **TypeScript Errors**
   ```bash
   # Install missing type definitions
   npm install @types/jest @types/node --save-dev
   ```

3. **Coverage Too Low**
   ```bash
   # Run coverage report to see uncovered lines
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

4. **Invalid URL Errors**
   When encountering "invalid URL" errors during node execution, the node now includes comprehensive debug logging:
   
   ```
   [DEBUG] Failed HTTP request - URL: /records/123, BaseURL: {{$credentials?.baseUrl}}/api, Full URL would be: {{$credentials?.baseUrl}}/api/records/123
   ```
   
   **Debugging Steps:**
   - Check that the `baseUrl` in credentials ends without a trailing slash
   - Verify the credential configuration is correct
   - Look for debug logs in the n8n console output
   - Ensure the InvenioRDM instance is accessible at the configured URL

## Future Improvements

- [ ] Increase integration test coverage
- [ ] Add performance benchmarks
- [ ] Implement visual regression testing
- [ ] Add mutation testing
- [ ] Create test data factories
- [ ] Add API contract testing