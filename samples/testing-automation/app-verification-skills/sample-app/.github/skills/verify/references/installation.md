# Installation — Prerequisites

`/verify` runs cloud-only against an Azure Playwright Workspace. There are only a few things the user has to have on the machine; the skill installs and configures everything else automatically.

## What the user must provide

1. **Azure CLI** installed and signed in:
   ```bash
   az --version
   az account show
   ```
   If `az` is missing, halt with: *"`/verify` needs the Azure CLI. Install it from https://learn.microsoft.com/cli/azure/install-azure-cli, then re-invoke `/verify`."*
   If `az account show` fails, halt with: *"Run `az login` (or set service-principal env vars in CI — `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, or `AZURE_FEDERATED_TOKEN_FILE`), then re-invoke `/verify`."*

2. **A Playwright Workspace** with the **"Playwright Workspace Contributor"** role assigned to the calling identity (Reader is not sufficient). Workspace creation is out of scope — if the user doesn't have one, point them at the [Azure Portal](https://ms.portal.azure.com/#create/Microsoft.PlaywrightWorkspace) (one-time, ~1 min) and halt.

3. **Node 18+**:
   ```bash
   node --version
   ```

## What the skill handles automatically

At Step 0, the skill bootstraps everything else without asking the user — these edits are part of the cloud-setup the user implicitly opted into by invoking `/verify`. **Full reference:** [`cloud-setup.md`](./cloud-setup.md#what-the-skill-handles-automatically-at-step-0).

The one constraint Copilot can't reach by itself: **all four Playwright packages must be pinned to the same minor version**, or `npx playwright test` errors with *"version mismatch between playwright-core and @playwright/test"*. Known-good set:

- `@playwright/cli@0.1.11`
- `@playwright/test@1.59.1`
- `playwright@1.59.1`
- `playwright-core@1.59.1` (forced via `overrides`)
- `@azure/playwright@1.1.5`
- `@azure/identity@4.13.1`
- `dotenv@17.4.2`

Pin all of these exactly, apply the loopback patch, write the cloud configs + `.env`, and wire `dotenv/config` into `playwright.config.ts`.

## Playwright project bootstrap (automatic)

If the repo has no `playwright.config.ts` (or `.js`) when `/verify` runs, the skill bootstraps a minimal Playwright project itself — **no consent prompt**. Treat this the same as any other Step 0 setup work the user already opted into by invoking `/verify`.

The bootstrap does NOT use `npm init playwright@latest` (interactive — prompts for language/dir/CI flags). Instead the skill writes the minimum needed for cloud testing:

1. Install the Playwright runner as part of the matched version set described in [cloud-setup.md](./cloud-setup.md#what-the-skill-handles-automatically-at-step-0) — no separate install needed here.
2. Write a minimal `playwright.config.ts` at the repo root:
   ```ts
   import 'dotenv/config';
   import { defineConfig } from '@playwright/test';
   export default defineConfig({
     testDir: 'tests',
     timeout: 60_000,
     use: {
       trace: 'on-first-retry',
     },
   });
   ```
3. Create the `tests/` directory if missing (empty — Phase 2 will populate it).
4. Continue with the rest of Step 0 bootstrap (the cloud sibling configs in [cloud-setup.md](./cloud-setup.md), the loopback patch, etc.).

If the repo has Vitest / Jest / Mocha but no Playwright, the skill still proceeds — those frameworks coexist; Playwright lives alongside them with its own `testDir`.
