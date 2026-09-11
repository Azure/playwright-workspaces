# Verification Report Format

The output produced by Phase 1 of `/verify`. Always markdown, always written to **chat** (stdout), never to a file in the repo.

## Structure

```markdown
# Verification Report — <flow name>

**Overall:** ✅ PASS  |  ❌ FAIL — <N> failure(s), <K> blocked
**App:** <URL>  |  **Browser:** chromium (session: verify)  |  **At:** <ISO timestamp>

## Steps

| # | Step | Outcome | Evidence (short) |
|---|---|---|---|
| 1 | Load <URL> | ✅ PASS | title: "Acme" |
| 2 | Click "Sign in" | ✅ PASS | nav → /login |
| 3 | Fill email + password, submit | ✅ PASS | redirect → /dashboard |
| 4 | Click "New Invoice" | ❌ FAIL | console error (see below) |
| 5 | Fill invoice form, save | ⏭ BLOCKED | step 4 failed |

## Failures

### Step 4 — `TypeError: Cannot read properties of undefined` on /invoices/new
- **Where:** clicked `New Invoice` on `/dashboard`, navigated to `/invoices/new`, form did not render.
- **Console (verbatim):**
  ```
  TypeError: Cannot read properties of undefined (reading 'id')
      at NewInvoiceForm (src/pages/NewInvoiceForm.tsx:42:18)
  ```
- **Network:** GET `/api/customers` → 200 OK, body shape `{ items: [...] }` (full body redacted — see sensitive-data rules).
- **Snapshot at failure:** [path/to/snapshot.yml — captured]
- **Likely cause:** the `customers` API response shape changed and `NewInvoiceForm` expects `customers[0].id` but the new shape is `{ items: [...] }`.

## Suggested next step

Looks like an app bug. Either:
- Fix `src/pages/NewInvoiceForm.tsx:42` to handle the new response shape, then re-verify with this skill.
- Or lock in a regression test now: re-run `/verify` once the bug is fixed to author a test that pins the corrected behavior.

---
**Final: ❌ FAIL — 1 failure at step 4. Steps 1-3 PASS. Step 5 BLOCKED by step 4.**
```

## Rules

- **Quote evidence honestly but concisely** — verbatim console errors, but no full network bodies or full snapshots inline. Link to saved snapshots / traces when they're large.
- **Redact sensitive data** before quoting evidence — emails, customer IDs, tenant IDs, tokens, order IDs, internal hostnames. See [sensitive-data.md](./sensitive-data.md). Prefer summaries like `[redacted email]`, `[customer id redacted]`, `[internal admin URL redacted]`.
- **Don't speculate beyond evidence.** If you can't tell whether a failure is an app bug or an environmental issue, say what info would disambiguate.
- **Suggested next step must be actionable** (specific file:line, specific re-invocation, specific env var to set). Don't say "investigate further" without a hook.

## When there are no failures

```markdown
# Verification Report — checkout flow

**Overall:** ✅ PASS — all 7 steps succeeded
**App:** http://localhost:3000  |  **Browser:** chromium (session: verify)  |  **At:** 2026-05-18T12:34:56Z

## Steps

| # | Step | Outcome |
|---|---|---|
| 1 | Load /                              | ✅ PASS |
| ... |
| 7 | Verify order confirmation page renders with order # | ✅ PASS |

---
**Final: ✅ PASS — all 7 steps succeeded.**
```

Skip the "Failures" and "Suggested next step" sections entirely.
