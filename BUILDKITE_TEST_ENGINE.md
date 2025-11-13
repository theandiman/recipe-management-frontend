# Buildkite Test Engine Setup

## Overview
This project is configured to use Buildkite Test Engine for test analytics when running in Buildkite CI.

## Setup

### 1. Install Test Collector
```bash
npm install --save-dev buildkite-test-collector
```

### 2. Set Environment Variable
In your Buildkite pipeline, add the `BUILDKITE_ANALYTICS_TOKEN` secret:

```yaml
env:
  BUILDKITE_ANALYTICS_TOKEN: # Set via Buildkite secret management
```

## Configuration

### Playwright (E2E Tests)
Already configured in `playwright.config.ts` to automatically use Buildkite Test Engine reporter when running in Buildkite.

The reporter is conditionally added only when `process.env.BUILDKITE` is set.

### Vitest (Unit Tests)
To add Test Engine support for unit tests, update `vitest.config.ts`:

```typescript
test: {
  reporters: [
    'default',
    ...(process.env.BUILDKITE ? ['buildkite-test-collector/vitest/reporter'] : [])
  ],
  includeTaskLocation: true, // Enable line/column capture
}
```

## Benefits
- Track test execution trends over time
- Identify flaky tests
- Monitor test suite performance
- Compare metrics across branches
- View detailed test analytics in Buildkite dashboard

## Documentation
https://buildkite.com/docs/test-engine/test-collection/javascript-collectors
