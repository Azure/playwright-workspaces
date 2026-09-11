# Consolidated Report Format

The final output of `/verify` after all applicable phases run. **One markdown report**, written two places:

1. **Inline to chat** — this is what the user sees immediately.
2. **Saved to `.verify/verify-report.md`** — single file overwritten each run. Gitignored. For share-in-chat / paste-into-PR / look-back-later. Step 0 adds `.verify/` to `.gitignore` automatically.

Mid-pipeline sub-reports (Phase 1 / 2 / 3) are inline-only — they're transient diagnostic logs; once the consolidated final exists, the chat scroll IS the sub-report archive.

## What the consolidated report covers

Outcomes and actions only. **No re-embedding of the Phase 1 / 2 / 3 sub-reports** — those already appeared in chat mid-pipeline; pointing back to them is enough.

- **Header** — pipeline status + app URL + workspace + region + branch + commit SHA + duration + ISO timestamp
- **Summary table** — one row per phase, headline outcome only
- **What needs YOUR attention** — priority-ordered actionable items (app bugs, decisions awaiting user, blocked flows)
- **Tests touched this run** — single table covering Phase 2 adds + Phase 3 heals, each with a per-test video link
- **HTML report URL** — `npx playwright show-report` auto-opened in the user's default browser
- **Suggested next steps** — specific re-invocation / fix instructions
- **One-line closing summary**

## Structure

```markdown
# /verify — App Test Pipeline Report

**Pipeline:** ✅ Complete  |  **App:** http://localhost:3000  |  **Workspace:** my-pw-ws (eastus)
**Branch:** feat/checkout-redesign @ `abc1234`  |  **Duration:** 4m 12s  |  **At:** 2026-05-22T14:42:00Z

## Summary

| Phase | Outcome |
|---|---|
| 1. App Verification | ✅ 5 PASS / ❌ 1 FAIL / ⏭ 1 blocked of 7 flows |
| 2. Test Authoring   | ✅ 4 tests added, all green |
| 3. Test Healing     | ⚠️ 5 fixed · 2 awaiting your decision |
| Final Sanity        | ✅ 4 / 4 green (videos in HTML report) |

## What needs YOUR attention

### 1. App bug — Checkout `Place Order` button
- **Where:** `src/pages/NewInvoiceForm.tsx:42` — `TypeError: Cannot read properties of undefined (reading 'id')`
- **Why:** `customers` API shape changed (`customers[0].id` → `{ items: [...] }`).
- **Action:** fix the source, then re-run `/verify` to author coverage.

### 2. Test mismatch — `tests/orders.spec.ts:67` "should show order total"
- **Test expected:** `$42.00` (3 × $14)  |  **App shows:** `$14.00` (only last item)
- **Your call:** intentional change (I'll update test) or regression (keep failing)?

### 3. Blocked flow — Settings/Billing (MFA challenge)
- Couldn't proceed past MFA. Either pre-capture `storageState`, or provide `TEST_USER_TOTP_SECRET`.

### 4. Unresolved test — `tests/legacy/old-flow.spec.ts:5`
- Couldn't heal; flow has been removed from the app (route 404s).
- **Your call:** keep failing / `test.fixme` / delete?

## Tests touched this run

| File | Phase | Result | Video |
|---|---|---|---|
| `tests/e2e/signup.spec.ts` | added | ✅ | `test-results/signup-Signup-chromium/video.webm` |
| `tests/e2e/login.spec.ts` | added | ✅ | `test-results/login-Login-chromium/video.webm` |
| `tests/e2e/dashboard-widgets.spec.ts` | added | ✅ | `test-results/dashboard-widgets-chromium/video.webm` |
| `tests/e2e/order-history.spec.ts` | added | ✅ | `test-results/order-history-chromium/video.webm` |
| `tests/checkout.spec.ts:42` | healed | ✅ | `test-results/checkout-add-to-cart-chromium/video.webm` |
| `tests/checkout.spec.ts:118` | healed | ✅ | `test-results/checkout-total-chromium/video.webm` |
| `tests/profile.spec.ts:33` | healed | ✅ | `test-results/profile-edit-chromium/video.webm` |
| `tests/orders.spec.ts:67` | awaiting decision | ⚠️ | `test-results/orders-total-chromium/video.webm` |
| `tests/legacy/old-flow.spec.ts:5` | awaiting decision | ⚠️ | `test-results/legacy-old-flow-chromium/video.webm` |

**HTML report (auto-opened):** http://localhost:9323 — each test's video, screenshots, and per-step DOM snapshots are embedded inline.

**Saved to `.verify/verify-report.md`** — share or revisit later.

## Suggested next steps

1. Fix `src/pages/NewInvoiceForm.tsx:42` (item #1 above).
2. Reply with your decisions on the 2 healing items (items #2 and #4).
3. Re-run `/verify` to lock in coverage for the now-working Checkout flow.

---
**Final:** Pipeline complete in 4m 12s. 4 tests added, 5 healed. 4 items need your attention.
```

## Rules

- **"What needs YOUR attention" comes BEFORE "Tests touched"** — actionable items first; the test table is reference.
- **Do NOT re-embed Phase 1 / 2 / 3 sub-reports.** They appeared inline mid-pipeline. The summary table + actionable items + tests-touched table is what the user needs at the end.
- **No iteration counts in action items.** Internal mechanics don't belong here — say "couldn't heal" or "unresolved" instead.
- **Cap the "Tests touched" table at ~20 rows.** For very large suites, group by directory and link to the HTML report for the rest.
- **Per-test video paths are workspace-relative**, shown in backticks (`test-results/.../video.webm`) — not as `file://` links. The HTML report at `http://localhost:9323` is the primary video-viewing interface; the table column is for reference / quick copy-paste to open a specific file.
- **Save to file in parallel with chat output.** If the file write fails, surface the failure but don't block chat output — the inline report is the primary deliverable.
- **Redact sensitive data** before quoting evidence — see [sensitive-data.md](./sensitive-data.md).
- **Don't speculate beyond evidence.** Mark unclear failures with what info would disambiguate.
- **Suggested next steps must be actionable.** Specific file:line, specific re-invocation command, specific env var to set.
- **Use exact handoff phrases** so the user can re-trigger `/verify` cleanly: *"Re-run `/verify` to cover the Checkout flow now that the app bug is fixed."*

## When one or more phases were skipped

Make it explicit in the Summary table:

```markdown
| Phase | Outcome |
|---|---|
| 1. App Verification | ✅ 7 PASS of 7 flows |
| 2. Test Authoring | ⏭ Skipped — no working uncovered flows |
| 3. Test Healing | ⏭ Skipped — no pre-existing tests |
| Final Sanity | ✅ 7 / 7 green |
```

## When the pipeline stopped early

If the pipeline stopped at Phase 1 (e.g. all flows BLOCKED or FAILED), trim the report:

- Header shows `❌ Stopped at Phase 1`
- "What needs YOUR attention" lists the environmental issues
- Skip "Tests touched" entirely (no tests ran)
- Closing summary names what's needed before re-running
