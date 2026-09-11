# Cloud Setup (Azure Playwright Workspaces) — Step 0 cloud bootstrap + runtime

This file owns everything cloud-browser-related in `/verify`:

- **One-time bootstrap** (first invocation, part of Step 0): matched Playwright version install, the `@azure/playwright` + `@azure/identity` install, the `playwright-core` loopback patch, the workspace-resource-ID prompt, and the `playwright.service.config.ts` / `.playwright/cli.config.json` / `.env` / `.gitignore` writes.
- **Per-invocation token refresh** (every Step 0): re-mint the short-lived `accessKey` in `.playwright/cli.config.json` via `az account get-access-token`, re-apply the loopback patch if a later `npm install` clobbered it.
- **Runtime contract**: how Phase 1 / Phase 2 / Phase 3 / Final Sanity each consume the cloud workspace, what flags they pass, what gets recorded.
- **Recovery** for cloud-specific failure modes.

For the non-cloud parts of Step 0, see siblings: [`repo-discovery.md`](./repo-discovery.md) (codebase + git history read), [`installation.md`](./installation.md) (Azure CLI prerequisite), [`app-launch.md`](./app-launch.md) (dev-server port discovery).

`/verify` runs cloud-only. Both `playwright-cli` (Phase 1 live exploration; also used by Phase 2 spec-driven authoring and Phase 3 debug-attach) and `npx playwright test` (Phases 2 / 3 / Final Sanity) route through an Azure Playwright Workspace.

## What the user must provide

- **Azure CLI** installed (`az --version`) and signed in: `az login` (or service-principal env vars `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_CLIENT_SECRET` / `AZURE_FEDERATED_TOKEN_FILE` for CI).
- **A Playwright Workspace** in any Azure subscription the user can access. If they don't have one, point them at the [Azure Portal](https://ms.portal.azure.com/#create/Microsoft.PlaywrightWorkspace) (one-time, ~1 min) and halt — workspace creation is out of scope.
- **"Playwright Workspace Contributor"** role (Reader is not sufficient; the dataplane connection requires the Contributor scope). See [workspace access docs](https://learn.microsoft.com/azure/app-testing/playwright-workspaces/how-to-manage-workspace-access).

## What the skill handles automatically (at Step 0)

The skill bootstraps cloud setup without asking the user — these edits are part of the cloud-setup the user implicitly opted into by invoking `/verify`:

1. **Install the matched Playwright version set.** All four packages MUST be pinned to the same minor version, or the test runner errors with *"version mismatch between playwright-core and @playwright/test"*. The known-good set:
   - `@playwright/cli@0.1.11`
   - `@playwright/test@1.59.1`
   - `playwright@1.59.1`
   - `playwright-core@1.59.1` (forced via `overrides` in `package.json`)

2. **Install `@azure/playwright@1.1.5` + `@azure/identity@4.13.1`** — `playwright.service.config.ts` imports both. Pin these exact versions; older `1.0.0-beta.*` releases of `@azure/playwright` referenced in some Microsoft Learn docs are deprecated.

3. **Loopback patch.** Apply the patch below to `node_modules/playwright-core/lib/tools/mcp/browserFactory.js`.

4. **Workspace configs + env var.** Ask the user **once** for their workspace resource ID (or Portal URL), then:
   - Write `playwright.service.config.ts` (committed)
   - Write `.playwright/cli.config.json` (gitignored, has short-lived token)
   - Write `.env` with `PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers` (gitignored — the Azure Playwright SDK reads this at test-runtime).
   - Update `.gitignore` to exclude `.playwright/`, `.env`, and `.verify/` (the consolidated-report drop-location) if not already excluded.

5. **Ensure `import 'dotenv/config';` is at the top of `playwright.config.ts`** so `PLAYWRIGHT_SERVICE_URL` reaches the test runner. This is the one additive edit to `playwright.config.ts` the skill permits. Add `dotenv@17.4.2` to `devDependencies` if missing.

Note: the upstream playwright-cli skill content (used as internal reference by our prompts) is shipped inside the `@playwright/cli` npm package itself at `node_modules/@playwright/cli/skills/playwright-cli/`. Our prompts read from there as internal knowledge — there is no separate skill install. We deliberately do **not** run `playwright-cli install --skills`, because that would drop a `.claude/skills/playwright-cli/` directory at the repo root and surface playwright-cli as a peer top-level skill alongside `/verify`. The top-level skill exposed by this plugin is `/verify` and only `/verify`; everything else is internal.

## Loopback patch (required)

The `exposeNetwork: '<loopback>'` field in `cli.config.json` only takes effect if `playwright-core`'s MCP `browserFactory.js` passes it through to `connectToBrowser`. Upstream PR [microsoft/playwright#40388](https://github.com/microsoft/playwright/pull/40388) ships the fix; until it lands in a release, the skill patches the locally-installed `playwright-core` itself.

The patch replaces:

```js
connectToBrowser)(playwrightObject, { endpoint })
```

with:

```js
connectToBrowser)(playwrightObject, { endpoint, exposeNetwork: config.browser.exposeNetwork })
```

Target file: `node_modules/playwright-core/lib/tools/mcp/browserFactory.js`. Applied at the start of every `/verify` invocation, idempotent.

```bash
node -e "const fs=require('fs');const p='node_modules/playwright-core/lib/tools/mcp/browserFactory.js';try{if(fs.existsSync(p)){const c=fs.readFileSync(p,'utf8');const t='connectToBrowser)(playwrightObject, { endpoint })';const r='connectToBrowser)(playwrightObject, { endpoint, exposeNetwork: config.browser.exposeNetwork })';if(c.includes(r))console.log('[verify] playwright-core already patched');else if(c.includes(t)){fs.writeFileSync(p,c.replace(t,r));console.log('[verify] patched playwright-core for exposeNetwork');}else console.warn('[verify] could not find expected browserFactory snippet — loopback may not work');}else console.warn('[verify] node_modules/playwright-core not found — run npm install first');}catch(e){console.warn('[verify] patch error:',e.message);}"
```

Three possible outcomes:

- *"already patched"* → safe to proceed.
- *"patched playwright-core for exposeNetwork"* → freshly applied; safe to proceed.
- *"could not find expected browserFactory snippet"* → `playwright-core` version doesn't match the patch shape. Most likely the user is on a much newer or much older `playwright-core`. Pin `playwright-core` to `1.59.1` via the `overrides` block in `package.json` and re-install.

If `npm install` runs again later (e.g. `npm ci` in CI), the patch is clobbered. The next `/verify` re-applies it on Step 0.

This patch is needed wherever `playwright-cli` connects to the cloud browser — i.e. **all three phases** (Phase 1's live verification session, Phase 2's spec-driven authoring exploration, Phase 3's debug-attach during failure diagnosis). The patch is applied once at Step 0 and covers every `playwright-cli` invocation that follows in the same `/verify` run.

`npx playwright test` runs (Phase 2's new-test execution, Phase 3's suite execution, Final Sanity) use a different code path — `@playwright/test` + `@azure/playwright` — and don't need this patch.

## One-time setup (first `/verify`)

When Step 0 doesn't find `playwright.service.config.ts` + `.playwright/cli.config.json`, the skill asks once:

> *"Cloud browsers required. Paste your Playwright Workspace resource ID, or the Azure Portal URL of the workspace.*
> *• Resource ID format: `/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.LoadTestService/playwrightWorkspaces/<name>`*
> *• Portal URL format: `https://ms.portal.azure.com/#@<tenant>/resource/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.LoadTestService/playwrightWorkspaces/<name>/overview`*
> *Don't have a workspace? Create one at https://ms.portal.azure.com/#create/Microsoft.PlaywrightWorkspace first, then paste the ID."*

The skill then:

1. **Normalizes the input to a clean resource ID.** Strip everything before `/subscriptions/` and everything after the workspace name. If a Portal URL was pasted, this peels off the `https://...#@tenant/resource` prefix and the trailing `/overview` (or any other tab segment). The resulting resourceId must match:
   ```
   /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.LoadTestService/playwrightWorkspaces/<name>
   ```
   Re-ask on bad input.

2. **Resolves workspace properties:**
   ```bash
   az rest --method GET \
     --url "https://management.azure.com<resourceId>?api-version=2026-02-01-preview"
   ```
   Reads `properties.dataplaneUri` + `location` from the JSON response. The dataplane URI looks like `https://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId-guid>`.

3. **Gets a fresh Entra token:**
   ```bash
   az account get-access-token \
     --scope https://management.core.windows.net/.default \
     --query accessToken -o tsv
   ```

4. Writes `playwright.service.config.ts` (sibling, **committed**). Note: this config reads `PLAYWRIGHT_SERVICE_URL` from the environment — loaded via `import 'dotenv/config'` in `playwright.config.ts` from the `.env` file (both wired up earlier in the same Step 0 bootstrap).
   ```ts
   import { defineConfig } from '@playwright/test';
   import { createAzurePlaywrightConfig } from '@azure/playwright';
   import { DefaultAzureCredential } from '@azure/identity';
   import baseConfig from './playwright.config';

   export default defineConfig(
     baseConfig,
     createAzurePlaywrightConfig(baseConfig, {
       credential: new DefaultAzureCredential(),
       connectTimeout: 3 * 60 * 1000,
     }),
     { workers: 10 },
   );
   ```
5. Writes `.playwright/cli.config.json` (**gitignored** — contains a short-lived token):
   ```json
   {
     "browser": {
       "browserName": "chromium",
       "isolated": true,
       "exposeNetwork": "<loopback>",
       "remoteEndpoint": "wss://<dataplaneUri>/browsers?browser=chromium&accessKey=<TOKEN>",
       "launchOptions": { "timeout": 180000 }
     }
   }
   ```
6. **Writes `.env`** with the workspace service URL (gitignored):
   ```
   PLAYWRIGHT_SERVICE_URL=wss://<dataplaneUri>/browsers
   ```
   Where `<dataplaneUri>` here is the region host extracted from the resourceId response (e.g. `eastus.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>`). Format: `wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers`. The Azure Playwright SDK reads this at test runtime to route through the workspace.

7. **Adds `.playwright/`, `.env`, and `.verify/`** to `.gitignore` if not already excluded. (`.verify/` holds the consolidated report saved at the end of each run.)
8. Proceeds to Phase 1.

If the repo has **no Playwright project at all** (no `playwright.config.ts`), the skill bootstraps a minimal one as part of Step 0 — see [installation.md](./installation.md#playwright-project-bootstrap-automatic). No consent prompt; this is part of cloud-setup the user implicitly opted into by invoking `/verify`.

## Per-invocation token refresh

The `accessKey` in `.playwright/cli.config.json` is short-lived (~1 h). At the start of every `/verify` invocation, after Step 0 discovery:

1. Read the existing `.playwright/cli.config.json`.
2. Regex-extract `dataplaneUri` from the existing `remoteEndpoint` (`wss://(.+?)/browsers`).
3. Get a fresh token via `az account get-access-token` (same command as above).
4. Rewrite `.playwright/cli.config.json` with the new token, preserving the dataplaneUri.

If `az` fails (login expired, network down), halt with a clear message: *"Token refresh failed: `<error>`. Run `az login` and re-invoke /verify."* Never proceed with a stale token.

## How each phase uses cloud

| Phase | Command pattern |
|---|---|
| **Step 0** | Detect configs; refresh token; gate or proceed. |
| **Phase 1** | `playwright-cli -s=verify open <URL>` — reads `.playwright/cli.config.json`, routes to remote browser. **No `--browser=` flag** — the `remoteEndpoint` URL specifies the browser via `?browser=chromium`. |
| **Phase 2** | `npx playwright test <file> --config=playwright.service.config.ts --reporter=line` |
| **Phase 3** | `npx playwright test --config=playwright.service.config.ts --reporter=json` |
| **Final Sanity** | `npx playwright test <scoped-files> --config=playwright.video.config.ts --reporter=line` — and `playwright.video.config.ts` **extends `playwright.service.config.ts`**, not the base config. |

## Out of scope

- **Local browsers.** Cloud-only is deliberate.
- **Headed mode.** Cloud workspaces don't expose a visible browser to the local user.
- **Workspace creation from the skill.** Use the Azure Portal — one-time, ~1 min.
- **Multi-workspace switching.** To switch: delete `playwright.service.config.ts`, `.playwright/cli.config.json`, and `.env` (it contains the workspace-bound `PLAYWRIGHT_SERVICE_URL`), then re-invoke `/verify`.
- **Non-chromium browsers.** Chromium only for now.

## Recovery

- **`az` not installed** → tell the user to install Azure CLI, then re-invoke.
- **Not logged in** → token call errors → instruct `az login`, then re-invoke.
- **Workspace not accessible (403)** → RBAC; user needs **"Playwright Workspace Contributor"** role (Reader is insufficient). Link to [workspace access docs](https://learn.microsoft.com/azure/app-testing/playwright-workspaces/how-to-manage-workspace-access).
- **Workspace not found (404)** → resource ID is wrong or workspace deleted; ask for a corrected ID.
- **`playwright-cli` connects but the navigation times out / hangs against `http://localhost:*`** → the `playwright-core` loopback patch didn't take effect. Check Step 0's bootstrap output for the patch line; if the snippet wasn't found, the version pin in `package.json` may have been reverted by a later install. Re-invoke `/verify` — Step 0 re-pins and re-patches.
