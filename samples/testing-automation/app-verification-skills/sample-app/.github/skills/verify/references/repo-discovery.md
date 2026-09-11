# Repository Discovery

Before exploring the live app or writing any test code, discover what the repository already has. Skipping this produces tests that fight existing patterns and miss real constraints.

## Where things live (don't search subdirectories)

Read these from the **repo root** only — they live there by convention, not nested under `src/` or `tests/`:

- `playwright.config.ts` (or `.js`)
- `.env.example`
- `package.json`

In **monorepos**, prefer the nearest `playwright.config.*` to the current working directory (or the target app / failing test the user named). If multiple projects match equally, pick the first and log the choice in the discovery summary — don't block the pipeline on the ambiguity.

## Don't read `.env` / `.env.local`

These hold secrets. Use `.env.example` (names only) for env var discovery. For runtime URLs / configs, prefer `playwright.config.ts` and `package.json` scripts.

## Discover in this order

### 1. Operational config

- **`playwright.config.ts`** — read `baseURL`, `testDir`, `projects`, custom fixtures / reporters. Check for `webServer` config (the project's defined way to start the app).
- **`.env.example`** — names of env vars the project expects.
- **`package.json`** — `scripts` like `test`, `test:e2e`, `playwright`, `dev`, `start`. Identify how the app is launched locally and how tests are invoked in CI.

### 2. CI / pipeline config

- **`.github/workflows/*.yml`**, **`azure-pipelines.yml`**, **`.ado/`**, or other pipeline definitions.
- Capture: the test command, required env vars, browser-install strategy, working directory, project / package filters, sharding.
- **Prefer the repo's CI test command** when validating new or healed tests — narrowed to the affected file when possible.

### 3. Backend services

The skill auto-starts whatever the app needs as part of Step 0:

- **`webServer`** in `playwright.config.ts` — Playwright's own way to start the app for tests.
- **Frontend dev script** in `package.json` (`dev`, `start`, etc.).
- **Backend services** via `docker-compose.yml`, README setup scripts, or `package.json` scripts for API / DB / Redis / queues.
- **Non-destructive migrations** (`db:migrate`, `migrate:up`).

The skill tracks PIDs / container IDs and stops them at the end of `/verify`. See [recovery.md](./recovery.md#app-not-running).

**Trust the dev server's stdout, not the configured `baseURL`.** Dev servers may bind to a different port than the config says (port already in use, interactive port prompt, auto-bump). Start each long-running server async with its own `shellId`, parse the actual URL from stdout, and update `baseURL` in `playwright.config.ts` to match before any browser session opens. See [app-launch.md](./app-launch.md).

**Only destructive setup is gated by a user prompt.** If a script's name or command looks like it would erase data, reset state, or otherwise destroy something the user might care about, get explicit confirmation before running it. Non-destructive operations run automatically.

### 4. Existing tests

- Locate the test directory (`tests/`, `e2e/`, `playwright/`, or whatever `testDir` in config says).
- If no test directory exists and `testDir` is unset, fall back to a sensible default (such as `tests/e2e/`) and state your choice before writing.
- Read a few representative tests to learn the **style**: `test.describe`? Custom fixtures? Page objects? File-naming pattern (`<area>.<flow>.spec.ts`)?
- Identify shared helpers, page objects (often under `tests/pages/`, `tests/poms/`, `tests/fixtures/`), and any `auth.setup.ts` + `storageState` pattern.
- Note whether tests reference env vars via `process.env.<NAME>` and whether `dotenv` is loaded in config.

### 5. Source code (for planning + verification)

- Source directories (`src/`, `app/`, `pages/`, `components/`, whatever the project uses) — read routes + primary components to understand the user-facing surface area, including flows that are hidden behind clicks or completed actions.
- `package.json` dependencies — note the framework and auth library in use; these inform exploration depth and selector strategies.

## Use what you discover, don't override it

- **Match the repo's test style.** Naming, file layout, page-object pattern — preserve them. Don't introduce a new pattern.
- **Reuse existing page objects.** If a PO already covers a flow you're touching, extend or reuse it.
- **Preserve auth conventions.** If the repo has `auth.setup.ts` + `storageState`, your generated tests consume it via `use.storageState`. Don't invent a new login path.
- **Don't change CI config** to make your tests work — fit your tests into existing CI.

## If something is unclear, ask

For ambiguous discovery (e.g. MFA mode not clear from code or live exploration), leave it as `"unknown — confirm with user"` rather than guessing. Hallucinated auth modes are a common failure source.
