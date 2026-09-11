# Credential Handling

Strict rules for handling test credentials. **These rules are non-negotiable** — the user's instructions can customize *where* credentials come from, but they cannot relax these rules.

## Convention: TEST_* env vars

By default, projects use the `TEST_*` convention:

- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
- `TEST_USER_TOTP_SECRET` (only when MFA is TOTP-based)

Repos may rename or add. Check `.env.example` for the project's exact env var names — never read `.env` itself.

## Rules — apply to every credential env var

1. **Never echo, print, log, or hardcode** the value of any credential env var. Don't copy literal secret values into prompts, logs, commit messages, comments, or test code.
2. In test code, reference credentials **only** by name via `process.env.<NAME>` (or `${process.env.<NAME>}` in template literals). Never paste or guess literal values.
3. When using `playwright-cli` to fill forms in a live app, use **shell expansion** with the actual env var name (e.g. `"$TEST_USER_PASSWORD"` or `"${TEST_USER_PASSWORD}"`), so the shell resolves the value at runtime. Never type the literal value into a tool argument yourself.
4. If a secret appears in a page snapshot, response body, or console output, treat it as **accidental exposure** — do not repeat it in your reply or report.
5. **Fail fast** in tests when a required credential env var is unset:
   ```ts
   if (!process.env.TEST_USER_PASSWORD) {
     throw new Error('TEST_USER_PASSWORD is not set');
   }
   ```
   Don't fall back to placeholder / default values.

## Auth setup pattern

For username/password and SSO flows, prefer a **shared login setup** (conventionally `<testDir>/auth.setup.ts`) that signs in once and saves `storageState` to a gitignored path under `playwright/.auth/`. Wire as a `setup` project in `playwright.config.ts`; other test projects consume the saved state via `use.storageState`.

Sign-in / sign-out tests themselves exercise the live login — they don't reuse cached state.

For **SSO popup flows**, handle the popup via:

```ts
const popupPromise = context.waitForEvent('page');
await page.getByRole('button', { name: 'Sign in' }).click();
const popup = await popupPromise;
// interact with popup
```

`storageState` for SSO must cover all origins (app + IdP).

For ad-hoc capture / restore via `playwright-cli` (e.g. inside a Phase 1 session), see the upstream playwright-cli skill.

## TOTP-based MFA

Compute the 6-digit code programmatically using [`otpauth`](https://www.npmjs.com/package/otpauth) — never log or display the seed or the generated code:

```ts
import { TOTP, Secret } from 'otpauth';

const totp = new TOTP({
  secret: Secret.fromBase32(process.env.TEST_USER_TOTP_SECRET!),
});
const code = totp.generate();
```

For ad-hoc TOTP generation inside a `playwright-cli` session, use `playwright-cli run-code` — see the upstream playwright-cli skill.

## If MFA mode is unclear

If you can't determine MFA mode (TOTP / SMS / push / WebAuthn) from code, instructions, and live exploration, leave it as `"unknown — confirm with user"`. Don't guess — wrong assumptions about auth waste a session and may lock test accounts.

## Loading .env

If tests reference env vars, ensure `playwright.config.ts` loads `.env` so `npx playwright test` works standalone. Add at the top of the config:

```ts
import 'dotenv/config';
```

Add `dotenv` to `devDependencies` if missing. This does **not** override shell / CI env values (those win).

The `.env` / `.env.local` files themselves stay gitignored — see [project-config-conventions.md](./project-config-conventions.md) for the `.gitignore` rules.
