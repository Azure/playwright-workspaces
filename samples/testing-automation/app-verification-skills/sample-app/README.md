# Invoice Processing — `verify` skill demo

A React + Vite invoice-processing app shipped with the **`verify`** Copilot CLI skill at [`.github/skills/verify/`](./.github/skills/verify/), so you can see the skill drive a full QA pass on a real app.

## What the `verify` skill does

A three-phase end-to-end testing pipeline driven by Copilot CLI:

1. **App verification** — drives a real browser via `playwright-cli`, exercises the core flows, captures snapshots and console errors
2. **Test authoring** — generates Playwright tests for working flows that aren't already covered
3. **Test healing** — re-runs the existing suite, classifies failures (`stale_test` vs real `regression`), fixes the stale ones, surfaces genuine regressions with evidence

All test execution happens on Playwright Workspaces cloud browsers — no local browser install, parallelized, with video + trace artifacts uploaded for inspection.

## Prerequisites

- **Azure subscription** with permissions to create Playwright Workspaces — [quickstart](https://learn.microsoft.com/en-us/azure/app-testing/playwright-workspaces/quickstart-run-end-to-end-tests?tabs=playwrightcli&pivots=playwright-test-runner)
- **Azure CLI** signed in (`az login`)
- **Copilot CLI** installed and signed in
- **Node.js 20+**

## Run the demo

```bash
npm install
npm run dev               # vite serves at http://localhost:5001
```

Then, in another terminal, from this same folder:

```bash
copilot
# then: /verify
```

Copilot CLI picks up `.github/skills/verify/` automatically — no plugin install, no manual registration. The skill verifies the app's flows, authors tests for any gaps, heals failing tests, and writes a consolidated report.

For examples of what those reports look like on this app: [`testing-skills.md`](./testing-skills.md), [`report.md`](./report.md), and [`skills-comparison.md`](./skills-comparison.md) (with vs without skills).

## Use the skill in your own repo

The skill folder is portable:

```bash
# from the root of your own project
cp -r path/to/playwright-workspaces/samples/testing-automation/app-verification-skills/sample-app/.github/skills/verify .github/skills/
```

Then `copilot` → `/verify` works the same way in your repo.

## More resources

- [Playwright Workspaces docs](https://aka.ms/pww/docs)
