# E2E Test Report — Invoice Processing App

**Date:** May 19, 2026
**Framework:** Playwright (Chromium)
**Test File:** `tests/invoice-app.spec.ts`
**Result:** ✅ **28 passed** | 0 failed | 17.5s total

---

## Summary

End-to-end tests cover the complete invoice processing workflow: queue management, a 3-step form wizard (Vendor Details → Line Items → Payment & Review), approval via OTP, navigation, and API error handling. All API calls are mocked with an in-memory store — no backend or database required.

---

## Test Results

### Invoice Queue (4 tests)

| # | Test | Status |
|---|------|--------|
| 1 | Shows empty state when no invoices exist | ✅ Pass |
| 2 | Shows invoice table when invoices exist | ✅ Pass |
| 3 | Clicking "Create New Invoice" opens the form | ✅ Pass |
| 4 | Clicking a table row opens the edit form | ✅ Pass |

### Step 1 — Vendor & Header Details (4 tests)

| # | Test | Status |
|---|------|--------|
| 5 | Vendor autocomplete fills vendor details | ✅ Pass |
| 6 | Copy billing to shipping checkbox works | ✅ Pass |
| 7 | Continue advances to Step 2 when all required fields filled | ✅ Pass |
| 8 | Continue does not advance with missing required fields | ✅ Pass |

### Step 2 — Line Items (7 tests)

| # | Test | Status |
|---|------|--------|
| 9 | Default line item exists on entry | ✅ Pass |
| 10 | Filling line item calculates amount | ✅ Pass |
| 11 | Add and remove line items | ✅ Pass |
| 12 | Tax percentage updates totals | ✅ Pass |
| 13 | Back button returns to Step 1 | ✅ Pass |
| 14 | Continue advances to Step 3 with valid line items | ✅ Pass |
| 15 | Continue does not advance with empty description | ✅ Pass |

### Step 3 — Payment & Review (6 tests)

| # | Test | Status |
|---|------|--------|
| 16 | Shows review summary with data from previous steps | ✅ Pass |
| 17 | Approval toggle shows/hides approver field | ✅ Pass |
| 18 | Submit without approval skips OTP modal | ✅ Pass |
| 19 | Submit with approval shows OTP modal | ✅ Pass |
| 20 | Entering OTP submits invoice and returns to queue | ✅ Pass |
| 21 | Back button returns to Step 2 | ✅ Pass |

### Full Happy Path (2 tests)

| # | Test | Status |
|---|------|--------|
| 22 | Create invoice with approval — end to end | ✅ Pass |
| 23 | Create invoice without approval — end to end | ✅ Pass |

### Navigation (3 tests)

| # | Test | Status |
|---|------|--------|
| 24 | "Back to Queue" button from form returns to queue | ✅ Pass |
| 25 | Header Queue button returns to queue | ✅ Pass |
| 26 | Step indicator reflects current step | ✅ Pass |

### API Error Handling (2 tests)

| # | Test | Status |
|---|------|--------|
| 27 | Shows error toast when invoice list fails to load | ✅ Pass |
| 28 | Shows error toast when invoice submission fails | ✅ Pass |

---

## Coverage Matrix

| Feature | Covered |
|---------|---------|
| Empty queue state | ✅ |
| Invoice table rendering | ✅ |
| Create new invoice flow | ✅ |
| Edit existing invoice (open) | ✅ |
| Vendor autocomplete & auto-fill | ✅ |
| Invoice number, currency, date fields | ✅ |
| Bill-to / Ship-to fields | ✅ |
| Copy billing → shipping | ✅ |
| Line item CRUD (add/remove) | ✅ |
| Line item amount auto-calculation | ✅ |
| Tax % and total recalculation | ✅ |
| Payment info fields | ✅ |
| SearchableSelect (currency, payment, cost centre, approver) | ✅ |
| Approval toggle on/off | ✅ |
| OTP approval modal | ✅ |
| Submit with approval (OTP flow) | ✅ |
| Submit without approval (direct) | ✅ |
| POST payload verification | ✅ |
| Success toast on submit | ✅ |
| Step navigation (back/forward) | ✅ |
| Back to Queue navigation | ✅ |
| Header Queue button | ✅ |
| Step indicator state | ✅ |
| Form validation — missing required fields | ✅ |
| Form validation — empty line item description | ✅ |
| API GET failure → error toast | ✅ |
| API POST failure → error toast | ✅ |

---

## Technical Details

- **API Mocking:** All `/api/invoices` endpoints are intercepted via `page.route()` with a stateful in-memory store per test, eliminating the need for CosmosDB or any backend.
- **Custom Components:**
  - *SearchableSelect* — interacted via focus → fill → click `role="option"`
  - *DatePickerInput* — filled via text input then `Tab` to trigger blur/parse
  - *InputOTP* — targeted via `data-field-id` with `pressSequentially()`
- **Selectors:** Uses `data-field-id` attributes and ARIA labels for stability over CSS class selectors.
- **Animations:** Playwright's built-in auto-waiting handles Framer Motion transitions without explicit sleeps.

---

## How to Run

```bash
# Install dependencies (first time only)
npx playwright install chromium

# Run all E2E tests
npx playwright test

# Run with visible browser
npx playwright test --headed

# Run a specific test suite
npx playwright test -g "Invoice Queue"

# View HTML report after run
npx playwright show-report
```
