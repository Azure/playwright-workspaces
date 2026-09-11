# Phase 2 — Test Authoring (playbook)

The second phase of `/verify`. Plan + write Playwright tests for **working uncovered flows** (i.e. flows that Phase 1 marked PASS but have no existing test coverage). Match the repo's existing test conventions. Run the new tests once to confirm green.

## Inputs from Phase 1

- **Flows-to-cover candidate set**: flows Phase 1 marked PASS that have NO existing test in the repo.
- **Flows-to-skip set**: flows Phase 1 marked FAIL — Phase 2 explicitly **does not** author tests against broken flows. Those flows will appear in the consolidated report as "user must fix the app first."

If the user's original prompt narrowed scope (e.g. "write tests for the checkout flow"), restrict candidates to that.

## Hard prerequisites

- `playwright-cli` available (auto-installed in Step 0 of `/verify` — never ask the user about npm installs).
- A Playwright project (`playwright.config.ts`). If absent, Step 0 silently writes a minimal one as part of the cloud-setup bootstrap — see [`installation.md`](./installation.md#playwright-project-bootstrap-automatic). **Do not** ask the user before running `npm init`-style commands or before creating `playwright.config.ts`; that's setup the user implicitly opted into.

## Plan (research before writing)

A good plan triangulates three sources — any single source has blind spots:

- **Source code** — routes, components, page objects, data models, business logic. What the dev *intends* the flow to do; where edge cases live in the code.
- **Live app** — Phase 1 already drove this flow; reuse those snapshots, locators, and the sub-flows it discovered. Captures real behavior, dynamic content, error paths the UI exposes, and features hidden behind clicks.
- **Existing tests** — read a few representative tests to learn the **style**: describe pattern, file naming, page objects, fixtures, auth setup. Identify shared helpers to reuse, and what's already covered (don't duplicate).

Output a brief plan (one paragraph per flow) before writing code. State the test file path you'll create and the assertions you'll make.

### Coverage breadth

The point of Phase 2 is **coverage**. Don't pre-filter aggressively — Copilot's own judgment about value can be wrong. Lean toward authoring tests for:

- **Each distinct user-observable behavior** in the in-scope flows — primary happy paths, and the sub-flows they reveal (the dialog after a click, the review step after submit, the management page after creation).
- **State transitions** — empty → filled, logged-out → authenticated, draft → submitted, valid → invalid.
- **Edge cases** — validation errors, empty states, very long input, boundary values, network-failure paths (use request mocking — see the upstream playwright-cli skill).

When in doubt, author the test. A thin suite that misses behaviors is worse than a slightly redundant one.

## Author

Use the spec-driven generation workflow from the upstream playwright-cli skill — drive the live app via `playwright-cli`, capture auto-generated TS per action, and write test files at the path the repo's conventions dictate.

### Where to put tests

- If `playwright.config.ts` sets `testDir`, use that.
- Otherwise fall back to a sensible default (such as `tests/e2e/`) and state your choice before writing.
- Don't scatter tests across multiple candidate directories.

### Authoring rules (layered on top of `playwright-cli`'s defaults)

- **Match the repo's test style** — describe pattern, file naming, page object usage, import paths. Discovered in Step 0; don't invent a new style. Reuse existing page objects.
- **Use role-based / accessibility-first locators**: `getByRole`, `getByLabel`, `getByText`. Test IDs are second-best when role doesn't disambiguate. CSS / XPath last resort.
- **No hardcoded URLs** — use `baseURL` from `playwright.config.ts` (`page.goto('/some/path')`, not `page.goto('https://...')`).
- **Assert on outcomes**, not surface. `expect(page).toHaveURL('/dashboard')` alone is surface — combine with a content assertion (e.g. dashboard widget renders).
- **No hardcoded waits.** Never `waitForTimeout()`, `waitForLoadState('networkidle')`, `waitForNavigation()`. Use auto-waiting + outcome assertions (`expect(locator).toBeVisible()`).
- **No `page.evaluate()`** as a substitute for user-facing assertions — tests exercise the app the way a user would, not via DOM introspection.
- **Auth** — follow [credential-handling.md](./credential-handling.md): credentials only via `process.env.<NAME>`, fail fast on missing env vars, use `auth.setup.ts` + `storageState` for shared auth, and TOTP via [`otpauth`](https://www.npmjs.com/package/otpauth). Sign-in / sign-out tests exercise live login.
- **For localized apps**, prefer role + test-id over hardcoded English text, unless the existing tests intentionally pin English.

## Run and iterate until green

Phase 2 owns its new tests end-to-end. A freshly-authored test rarely passes on the first try — fix it in place. Phase 2 is **not done** while its tests are red.

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test <newly-written-file> --config=playwright.service.config.ts --reporter=line
```

On failure, the cause is almost always an authoring mistake (the flow itself was Phase-1-PASS): wrong selector, wrong expected value, missing wait-on-outcome, wrong step order, missing import. Fix in place and re-run.

**Stop iterating once you're not making progress.** As long as each fix changes the failure mode (closer to green, different error), keep going. If the same failure persists across iterations or the only "fix" would be to relax the assertion, stop and surface the test with three choices for the user:

1. **Keep failing** — preserve coverage signal; flag it as work-in-progress.
2. **Quarantine** with `test.fixme(...)` + a comment pointing at the unresolved cause.
3. **Delete** — only with explicit user confirmation.

**Never silently delete.** Never use `test.skip(...)` as a "fix."

Phase 2 does **not** hand failing tests to Phase 3. Phase 3 is for pre-existing tests only.

If a new test's failure looks like a **real app bug** (the flow worked in Phase 1 but the test exposes a deeper issue), surface it the same way Phase 3 would: stop, don't relax the assertion, ask the user.

## Don't modify the project's config

Follow [project-config-conventions.md](./project-config-conventions.md). The only edit to `playwright.config.ts` that's ever OK from this phase is adding `import 'dotenv/config';` when tests need env vars and it isn't already there (a strictly additive change). Add `dotenv` to `devDependencies` in the same edit.

## Output

Emit the Phase 2 sub-report in chat (this is the mid-pipeline diagnostic — full consolidated final comes after Phase 3 + Final Sanity). Format:

```markdown
## Phase 2 — Test Authoring

**Tests added:** N  |  **All green:** ✅ N / ⚠️ K awaiting your decision

### Tests added
- `tests/e2e/checkout.spec.ts` — covers full checkout (add to cart → fill shipping → place order → confirmation) — ✅ green
- `tests/e2e/signup.spec.ts` — covers signup with email verification — ✅ green

### Awaiting your decision (if any)
- `tests/e2e/dashboard-widgets.spec.ts` — couldn't resolve a timing issue around lazy-loaded charts.
  - **Your call:** keep failing / quarantine via `test.fixme` / delete?

### Flows NOT authored (from Phase 1's FAIL list)
- `New Invoice` flow — broken in app (Phase 1 found regression at `src/pages/NewInvoiceForm.tsx:42`). Fix the app and re-run `/verify` to cover this flow.
```

Don't invent counts. Don't fabricate coverage percentages. The full per-test video links and end-state status go in the consolidated final report — not here.

## Recovery

See [recovery.md](./recovery.md) for browser crash / auth blocked / app not running paths.

## Out of scope (Phase 2)

- Authoring tests for flows Phase 1 marked FAIL.
- Modifying pre-existing tests — those are Phase 3's responsibility.
- Initializing Playwright with `npm init playwright@latest` (the skill bootstraps a minimal `playwright.config.ts` itself in Step 0, automatically).
- Creating PRs — caller's choice.
- Unit / component / API / load / a11y tests.

Healing **new** tests Phase 2 just wrote is in scope (the iteration loop above). Healing **pre-existing** tests is Phase 3.
