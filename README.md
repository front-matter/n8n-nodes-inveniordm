# n8n-nodes-inveniordm

![Tests](https://github.com/front-matter/n8n-nodes-inveniordm/workflows/Tests/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/front-matter/n8n-nodes-inveniordm/badge.svg?branch=main)](https://coveralls.io/github/front-matter/n8n-nodes-inveniordm?branch=main)
[![npm version](https://badge.fury.io/js/n8n-nodes-inveniordm.svg)](https://badge.fury.io/js/n8n-nodes-inveniordm)

This is an n8n community node. It lets you use InvenioRDM in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The following operations are supported:

- Records
    - Get a record
    - Get many records
- Communities
    - Get a community
    - Get many communities

## Credentials

You can use a personal access token to use this node.

### Personal access token

1. Create an account in an InvenioRDM instance and login.
1. Go to your Applications page.
1. In the right navigation, under Personal access tokens, select New token.
1. Enter a descriptive name for your token in the Token name field, like n8n integration.
1. Select Scopes for your token, currently only the `user:email` scope is supported.
1. Click Create.
1. Copy the token.

![New personal access token](/nodes/inveniordm/new_personal_access_token.png)

## Testing

This package includes comprehensive tests to ensure reliability and functionality:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only smoke tests
npm test -- test/smoke.test.ts

# Run end-to-end tests (requires test instance)
npm run test:e2e
```

### Test Categories

- **Smoke Tests**: Basic functionality and instantiation tests
- **Unit Tests**: Detailed testing of individual components
- **Integration Tests**: Testing of node operations with mocked APIs
- **E2E Tests**: End-to-end testing against live InvenioRDM instances

### Test Environment Variables

For E2E testing against a live InvenioRDM instance:

```bash
export TEST_INVENIORDM_URL="https://your-test-instance.org"
export TEST_INVENIORDM_TOKEN="your-test-token"
```

### Coverage

The test suite aims for comprehensive coverage of:
- Credentials validation and authentication
- All node operations (CRUD for records, read for communities)
- Error handling and edge cases
- Input validation and type safety

## Compatibility

Compatible with n8n@1.60.0 or later

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Watch for changes during development
npm run build:watch
```

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [InvenioRDM API docs](https://inveniordm.docs.cern.ch/reference/rest_api_index/)
* [Jest Testing Framework](https://jestjs.io/)
* [TypeScript](https://www.typescriptlang.org/)
