# End-to-End (E2E) Tests for InvenioRDM Node

The E2E tests verify integration with real InvenioRDM APIs. They are disabled by default to avoid hitting external APIs during normal test runs.

## Enabling Tests

### Option 1: Environment Variables (Recommended)
```bash
export RUN_E2E_TESTS=true
export INVENIORDM_BASE_URL=https://inveniordm.web.cern.ch  # Optional, default is InvenioRDM Demo Site
export INVENIORDM_ACCESS_TOKEN=your_token_here   # Optional, for authenticated tests

npm run test:e2e
```

### Option 2: Edit Code Directly
Edit `test/e2e/inveniordm.e2e.test.ts` and change:
```typescript
const SHOULD_RUN_E2E = false; // Change to true
const BASE_URL = 'https://inveniordm.web.cern.ch/api'; // Change to your InvenioRDM URL
const ACCESS_TOKEN = ''; // Add your access token (optional)
```

## Available Tests

The E2E tests cover the following scenarios:

### 1. **Load Options Tests**
- `getResourceTypes()`: ✅ Loads available resource types from API (25 types on demo site)

### 2. **Record Operations**
- **GET Single Record**: ✅ Loads a specific record
- **GET Many Records**: ✅ Loads multiple records with pagination (3 records fetched successfully)
- **Error Handling**: ✅ Tests behavior with network errors and invalid IDs

### 3. **Community Operations** 
- **GET Communities**: Loads available communities
- **Community Metadata**: Tests community information

### 4. **Vocabulary Operations**
- **Resource Types**: Loads available resource types
- **Subjects**: Loads subjects/keywords

## Test Configuration

### Default URLs
- **InvenioRDM Demo Site** (Default): `https://inveniordm.web.cern.ch/api`
- **Zenodo Production**: `https://zenodo.org/api`
- **Zenodo Sandbox**: `https://sandbox.zenodo.org/api`
- **Local Instance**: `http://localhost:5000/api`

### Access Token
An access token is only required for authenticated operations (if implemented). Most read-only operations work without a token.

## Security Notes

- Tests only perform **read-only operations**
- No records are created, modified, or deleted
- Tests are non-destructive and safe for production APIs

## Example Execution

```bash
# With environment variables (Demo site is default)
RUN_E2E_TESTS=true npm run test:e2e

# Against another InvenioRDM instance
RUN_E2E_TESTS=true INVENIORDM_BASE_URL=https://zenodo.org/api npm run test:e2e

# Specifically for InvenioRDM Demo Site
RUN_E2E_TESTS=true INVENIORDM_BASE_URL=https://inveniordm.web.cern.ch/api npm run test:e2e

# With access token for authenticated tests
RUN_E2E_TESTS=true INVENIORDM_ACCESS_TOKEN=your_token npm run test:e2e
```

## Instance-Specific Notes

### InvenioRDM Demo Site (https://inveniordm.web.cern.ch/api)
- ✅ **Get Resource Types** works (`/vocabularies/resourcetypes` - 25 types)
- ✅ **Get Single Records** works (`/records/{id}`)
- ✅ **Get Communities** works (`/communities` - 3 communities)
- ✅ **Get Multiple Records** works (`/records` - 3 records fetched successfully)

## Troubleshooting

### ESLint Errors
If ESLint errors occur, the necessary disables are already included in the file.

### Network Timeouts
Tests have extended timeouts (15 seconds) for network operations. For slow connections, these can be adjusted in the file.

### API Changes  
If the InvenioRDM API changes, the expected response structures in the tests may need to be updated.