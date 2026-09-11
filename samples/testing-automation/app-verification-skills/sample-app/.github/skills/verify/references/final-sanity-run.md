# Final Sanity Run

End-of-pipeline scoped re-run with **video recording on**. Video evidence is part of the deliverable — the user wants to see what passed, not just be told.

## When to run

Whenever the repo has any Playwright tests at all — pre-existing OR newly authored by Phase 2. Skip only when there's no test suite (no `*.spec.ts` anywhere and Phase 2 didn't add any).

## What to re-run

Scope = every `*.spec.ts` that's relevant to the end-state:

- All tests Phase 2 created this session.
- All tests Phase 3 modified this session.
- All pre-existing tests (when Phase 2/3 didn't add/heal anything — the user still wants to see the suite is green).
- If Phase 2/3 edited shared files (page objects, fixtures, `auth.setup.ts`, helpers), also include `*.spec.ts` files that import them.

State the scope before running.

## How to run with video

Use the sibling `playwright.video.config.ts` pattern from [project-config-conventions.md](./project-config-conventions.md) — never modify the project's own `playwright.config.ts`. The video config extends `playwright.service.config.ts`:

```ts
import baseServiceConfig from './playwright.service.config';
import { defineConfig } from '@playwright/test';

export default defineConfig(baseServiceConfig, { use: { video: 'on' } });
```

Run with `--config=playwright.video.config.ts --reporter=line`. Playwright writes videos under `test-results/<test>/video.webm`.

## Auto-open the HTML report

After the run, **auto-open the Playwright HTML report in the user's default browser**:

```bash
npx playwright show-report
```

Playwright serves on `http://localhost:9323` by default and opens the user's browser. Each test has its video, screenshots, and per-step DOM snapshots embedded inline. Do not set `PLAYWRIGHT_HTML_OPEN=never` for `show-report` — auto-open is the point.

Feed into the **Tests touched this run** table in the [consolidated report](./consolidated-report.md). Per-test video paths go in that table as workspace-relative paths in backticks (e.g. `test-results/.../video.webm`) — not as a separate list. The HTML report URL (`http://localhost:9323`) goes in the banner / footer of the consolidated report.

A test that passed in its per-phase run but **fails here** is a cross-test interaction — usually a shared-helper regression. Call it out clearly; this step exists to catch exactly that.
