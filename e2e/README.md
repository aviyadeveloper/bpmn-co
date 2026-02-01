# E2E Tests

End-to-end tests for the BPMN Diagramer application using Playwright.

## Setup

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npm run install:browsers
```

## Running Tests

Run all tests (headless):

```bash
npm test
```

Run with UI (interactive mode):

```bash
npm run test:ui
```

Run with visible browser:

```bash
npm run test:headed
```

Debug mode (step through tests):

```bash
npm run test:debug
```

## Test Coverage

- **Single user blank diagram**: Create and edit a blank diagram
- **Single user template editing**: Open and modify a template
- **Multi-user collaboration**: Two users join the same session
- **Real-time editing**: Verify changes sync between users

## Test Structure

- `global-setup.ts` - Starts Python and client servers once for all tests
- `helpers/servers.ts` - Server orchestration utilities
- `tests/smoke.spec.ts` - Basic smoke tests
- `tests/user-flow.spec.ts` - Main user flow tests

## Recording Interactions

To record new test interactions:

```bash
npm run codegen
```

This opens Playwright Inspector where you can record browser actions and generate test code.

## Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Videos, screenshots, and traces are saved in `test-results/` directory.
