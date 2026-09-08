# Playwright Advance Framework

A TypeScript-based end-to-end and API test automation framework built on
[Playwright Test](https://playwright.dev/). It is structured around the Page
Object Model (POM), path-aliased imports, environment-driven configuration,
and Allure reporting.

> **Status:** the framework is wired up and actively growing. `src/pages`
> holds Page Object Model classes for the TTACart demo app (`LoginPage`,
> `InventaryPage` (exports class `InventoryPage`), `ItemDetailPage`,
> `CartPage`, `CheckoutStepOnePage`, `CheckoutStepTwoPage`,
> `CheckoutCompletePage`, `BasePage`). `src/fixtures/test-base.ts` wraps
> them into a custom `test` with one fixture per page object plus
> reusable login/cart states. `src/tests/LoginPage.spec.ts` and the specs
> under `src/tests/e2e/` are the specs so far. `src/config` now has
> `.env`-reading helpers (`env.ts`, `credentials.ts`). `src/api` is still
> an empty placeholder (`.gitkeep` only) even though `src/fixtures` and
> `src/testdata` already reference a `BookingApi` client that hasn't been
> added there yet — see **Known Issues** below. No npm scripts exist yet
> — use the Playwright CLI directly (see below).

## Tech Stack

| Tool | Purpose |
|---|---|
| [`@playwright/test`](https://playwright.dev/) | Test runner / browser automation |
| TypeScript (pinned `5.9.3`) | Language / static typing — pinned intentionally, see `tsconfig.json` notes |
| [`allure-playwright`](https://www.npmjs.com/package/allure-playwright) | Rich HTML test reports |
| [`@faker-js/faker`](https://www.npmjs.com/package/@faker-js/faker) | Fake/random test data generation |
| [`ajv`](https://www.npmjs.com/package/ajv) + `ajv-formats` | JSON schema validation (useful for API response assertions) |
| [`csv-parse`](https://www.npmjs.com/package/csv-parse) | CSV test-data driven testing |
| [`jsonpath-plus`](https://www.npmjs.com/package/jsonpath-plus) | Querying JSON payloads (API tests) |
| [`xlsx`](https://www.npmjs.com/package/xlsx) | Excel-based test data |
| [`winston`](https://www.npmjs.com/package/winston) | Logging |
| [`dotenv`](https://www.npmjs.com/package/dotenv) | Environment variable loading |

## Prerequisites

- Node.js (LTS recommended — CI uses `lts/*`)
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

## Environment Configuration

Configuration is loaded from a `.env` file in the project root via `dotenv`
(see `playwright.config.ts`). Copy/create a `.env` file with the following
keys:

| Variable | Purpose |
|---|---|
| `TTA_ENV` | Selects which environment to target: `qa` (default), `dev`/`local`, `stg`/`stage`/`staging`, `prod`/`production`, or `api` |
| `BASE_URL` | Explicit override — if set, takes priority over `TTA_ENV` |
| `QA_BASE_URL` | Base URL used when `TTA_ENV=qa` |
| `DEV_BASE_URL` | Base URL used when `TTA_ENV=dev`/`local` |
| `STG_BASE_URL` | Base URL used when `TTA_ENV=stg`/`stage`/`staging` |
| `PROD_BASE_URL` | Base URL used when `TTA_ENV=prod`/`production` |
| `API_BASE_URL` | Base URL used when `TTA_ENV=api` (e.g. an API-only test run) |
| `LOG_LEVEL` | Logging verbosity (consumed by `winston`) |
| `TEST_ENV` / `TEST_AUTHOR` | Metadata, e.g. for reporting |
| `USERNAME` / `PASSWORD` | Credentials for UI login flows |

> `.env` is intentionally **not** in `.gitignore` and its current contents
> (non-secret URLs/config) are tracked in this repo on purpose. If you add
> real credentials to it later, move those specific keys to a separate,
> gitignored file instead of assuming `.env` itself is ignored.

## Project Structure

```
.
├── .github/workflows/playwright.yml   # CI: installs deps/browsers, runs tests, uploads report
├── playwright.config.ts               # Playwright Test configuration
├── tsconfig.json                      # TypeScript config + path aliases
├── src/
│   ├── api/                           # API client / request wrappers (empty — see Known Issues)
│   ├── config/                        # Environment & framework configuration
│   │   ├── env.ts                     # .env loading + requireEnv/envOr/assertEnv helpers
│   │   └── credentials.ts             # Test-account credentials (env-driven, non-secret defaults)
│   ├── fixtures/                      # Playwright custom fixtures
│   │   ├── test-base.ts               # Custom `test` with one fixture per Page Object + login states
│   │   └── booker.fixture.ts          # `test` extended with a BookingApi client + auth token
│   ├── pages/                         # Page Object Model classes
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── InventaryPage.ts           # exports class InventoryPage
│   │   ├── ItemDetailPage.ts
│   │   ├── CartPage.ts
│   │   ├── CheckoutStepOnePage.ts
│   │   ├── CheckoutStepTwoPage.ts
│   │   └── CheckoutCompletePage.ts
│   ├── testdata/                      # Static/generated test data
│   │   ├── logintestdata.json         # TTACart demo accounts
│   │   └── booking.data.ts            # Faker-driven restful-booker payload builders
│   ├── tests/                         # Spec files (Playwright testDir)
│   │   ├── LoginPage.spec.ts
│   │   └── e2e/                       # Checkout end-to-end specs
│   └── utils/                         # Shared helper utilities
│       ├── CustomReporter.ts          # Custom HTML reporter (see Reporting below)
│       ├── DataGenerator.ts
│       ├── Logger.ts
│       └── UtilElementLocator.ts
├── rules/                             # (reserved)
└── docs/                              # (reserved)
```

## Path Aliases

`tsconfig.json` defines the following import aliases (resolved relative to
the project root):

| Alias | Resolves to |
|---|---|
| `@api/*` | `src/api/*` |
| `@config/*` | `src/config/*` |
| `@fixtures/*` | `src/fixtures/*` |
| `@pages/*` | `src/pages/*` |
| `@testdata/*` | `src/testdata/*` |
| `@utils/*` | `src/utils/*` |

These aliases are resolved natively by the Playwright test runner. If you
ever run TypeScript files outside of `playwright test` (e.g. via plain
`ts-node`), you'll need a runtime resolver such as `tsconfig-paths` for the
aliases to work.

## Playwright Configuration Highlights

(`playwright.config.ts`)

- **Test directory:** `./src/tests`
- **Timeout:** 60s per test, 10s for assertions
- **Fully parallel** execution
- **Retries:** 2x on CI, 0 locally
- **Reporters:** HTML report (`playwright-report/`) + `list` (console).
  `src/utils/CustomReporter.ts` is written but currently **disabled** —
  see Reporting below.
- **Trace:** always recorded
- **Screenshots:** always recorded
- **Video:** always recorded
- **Projects:** Chromium enabled by default (Firefox, WebKit, mobile
  viewports, and branded Chrome/Edge are pre-wired but commented out)

## Running Tests

No `npm` scripts are defined yet, so run Playwright directly:

```bash
# Run the full suite
npx playwright test

# Run in headed mode
npx playwright test --headed

# Run a single file
npx playwright test path/to/spec.ts

# Run against a specific environment
TTA_ENV=stg npx playwright test

# View the last HTML report
npx playwright show-report
```

## Continuous Integration

`.github/workflows/playwright.yml` runs on every push/PR to `main`/`master`:
installs dependencies, installs browsers, runs `npx playwright test`, and
uploads `playwright-report/` as a build artifact (30-day retention).

## Reporting

- Playwright's built-in HTML reporter writes to `playwright-report/`
  (view with `npx playwright show-report`); `list` prints live progress to
  the console.
- `src/utils/CustomReporter.ts` implements a richer standalone HTML report
  (written to `tta-report/`) with AI-assisted RCA and flaky-test tabs. It
  is currently commented out in `playwright.config.ts` because it imports
  `src/ai/agents/rcaAgent.ts`, `src/ai/agents/flakyAnalyzer.ts`, and
  `src/ai/config/providers.ts`, none of which exist yet in this repo. Add
  those modules (or stub them out) before re-enabling it in the `reporter`
  array.
- `allure-playwright` is included as a dependency for Allure-style reporting
  but is not yet wired into `playwright.config.ts`'s `reporter` list.

## Known Issues

`npx tsc --noEmit` currently reports real errors — CI does not run this
check separately, so these won't fail a build, but they will bite anyone
who imports the affected modules:

- `src/fixtures/booker.fixture.ts` and `src/testdata/booking.data.ts`
  import `../api/BookingApi`, which doesn't exist yet — `src/api/` is
  still `.gitkeep`-only.
- `src/fixtures/test-base.ts` imports `@pages/InventoryPage`, but the file
  is still named `src/pages/InventaryPage.ts` (the exported class was
  renamed to `InventoryPage`; the filename wasn't).
- `src/testdata/booking.data.ts` calls `DataGenerator.dateOffset`,
  `.number`, `.bool`, and `.oneOf`, none of which exist on
  `src/utils/DataGenerator.ts` yet.
- `src/tests/e2e/*.spec.ts` import `@utils/logger` (lowercase) and
  `@utils/visualStep`; the former only differs in case from the real
  `src/utils/Logger.ts` (breaks on case-sensitive filesystems/CI), and the
  latter doesn't exist.
- `src/utils/CustomReporter.ts` still can't load — see the reporter note
  above.
