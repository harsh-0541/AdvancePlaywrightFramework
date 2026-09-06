# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a scaffolded Playwright + TypeScript test automation framework. The
configuration, tooling, and CI pipeline are fully wired up, but `src/api`,
`src/config`, `src/fixtures`, `src/pages`, `src/testdata`, and `src/utils`
are currently empty (`.gitkeep` placeholders only) — no test specs, page
objects, or fixtures exist yet. `playwright.config.ts` points `testDir` at
`./src/tests`, which does not exist yet either.

**Known blocker:** `playwright.config.ts`'s `reporter` array includes
`['Lisy']`, which is not a real Playwright reporter (`Cannot find module
'Lisy'`) — this is almost certainly a typo for `'list'`. As configured, *no*
`playwright test` invocation will run until this is fixed, independent of
whether test files exist.

## Commands

No `npm` scripts are defined in `package.json` — use the CLI tools directly.

```bash
# Install dependencies
npm install

# Install Playwright browsers (required once, and after Playwright upgrades)
npx playwright install --with-deps

# Type-check the project (no emit)
npx tsc --noEmit

# Run the full suite
npx playwright test

# Run a single spec file
npx playwright test path/to/spec.ts

# Run a single test by title
npx playwright test -g "test title substring"

# Run headed / debug a specific test
npx playwright test --headed
npx playwright test --debug path/to/spec.ts

# Run against a specific environment (see Environment Selection below)
TTA_ENV=stg npx playwright test

# View the last HTML report
npx playwright show-report
```

## Architecture

### Environment selection (`playwright.config.ts`)

`baseURL` is resolved by `resolveBaseURL()` in `playwright.config.ts`, not
hardcoded. Precedence:

1. `BASE_URL` env var, if set — used as-is regardless of `TTA_ENV`.
2. Otherwise, `TTA_ENV` (default `qa`) selects one of: `qa`, `dev`/`local`,
   `stg`/`stage`/`staging`, `prod`/`production`, `api` — each mapping to its
   own `*_BASE_URL` env var (`QA_BASE_URL`, `DEV_BASE_URL`,
   `STG_BASE_URL`, `PROD_BASE_URL`, `API_BASE_URL`), each with a hardcoded
   fallback URL if that var isn't set.

All env vars are loaded from a root `.env` file via `dotenv.config()` at the
top of `playwright.config.ts`. `.env` is **not** in `.gitignore` and its
current contents (non-secret URLs/config) are intentionally tracked in this
repo — don't assume it's ignored the way `.env` files usually are.

### TypeScript setup — pinned intentionally

`typescript` is pinned as an exact version (`5.9.3`) in `devDependencies`.
This is deliberate, not incidental: TypeScript 7 removed
`moduleResolution: "node"` and `baseUrl` as valid `compilerOptions` (they
now hard-error with TS5108/TS5102), and this project's `tsconfig.json` uses
both. Before this pin existed, `npx tsc` silently fell back to whatever
`tsc` was globally installed, which could be TS7 and would fail. Do not
remove the `typescript` devDependency or change `moduleResolution`/`baseUrl`
in `tsconfig.json` without keeping both in sync — if you need
`node16`/`nodenext`/`bundler` resolution instead, `baseUrl` must be removed
and `paths` targets must become relative (`./src/api/*`), and `moduleResolution: "node16"`/`"nodenext"` requires `module` to match.

### Path aliases

`tsconfig.json` defines aliases resolved against `baseUrl: "."`:
`@api/*` → `src/api/*`, `@config/*` → `src/config/*`, `@fixtures/*` →
`src/fixtures/*`, `@pages/*` → `src/pages/*`, `@testdata/*` →
`src/testdata/*`, `@utils/*` → `src/utils/*`.

Playwright's own test runner resolves these natively from `tsconfig.json`.
They are **not** resolved automatically if you run `.ts` files through
plain `ts-node` or `node` — that requires a runtime resolver such as
`tsconfig-paths`, which is not currently a dependency.

### Intended layer structure (per `tsconfig.json` paths / directory scaffolding)

- `src/api` — API client / request wrappers
- `src/config` — environment & framework configuration
- `src/fixtures` — Playwright custom fixtures (test/page setup extension)
- `src/pages` — Page Object Model classes
- `src/testdata` — static/generated test data (the project depends on
  `@faker-js/faker`, `csv-parse`, and `xlsx`, implying data-driven tests
  sourced from generated fakes, CSV, and Excel)
- `src/utils` — shared helpers (`winston` for logging, `ajv`/`ajv-formats`
  for JSON schema validation, `jsonpath-plus` for querying JSON — these
  point at API-response assertions being a first-class use case, not just
  UI testing)

### Reporting

Playwright's HTML reporter is enabled and writes to `playwright-report/`.
`allure-playwright` is a dependency but is **not** currently wired into the
`reporter` array in `playwright.config.ts` — if adding Allure reporting,
that array is where it needs to be registered.

### CI (`.github/workflows/playwright.yml`)

Runs on push/PR to `main`/`master`: `npm ci` → `npx playwright install
--with-deps` → `npx playwright test` → uploads `playwright-report/` as an
artifact (30-day retention). CI does not currently run `tsc --noEmit`
separately.
