# Migration Guide: Microsoft Playwright Testing to Playwright Workspaces

This guide walks you through migrating from **Microsoft Playwright Testing** to **[Playwright Workspaces](https://aka.ms/pww/docs)**.

For most users, the migration involves:

1. Creating a Playwright Workspaces resource
2. Updating your test project (dependencies and config)
3. Updating CI pipeline service connections

> If you run into issues, email `playwrighttesting@microsoft.com` or file a support request via the Azure Portal if you have a support plan.

## Table of Contents

* [Common Setup Steps](#common-setup-steps)
* [Which Scenario Applies to You?](#which-scenario-applies-to-you)
* [Playwright Test Runner with Service Package (Most Common)](#playwright-test-runner-with-service-package-most-common)
* [Other Scenarios](#other-scenarios)

  * [Playwright Test Runner with `connectOptions`](#playwright-test-runner-with-connectoptions)
  * [Node.js Manual Browser Launch](#nodejs-manual-browser-launch)
  * [.NET NUnit with Service Package](#net-nunit-with-service-package)
  * [.NET Manual Connect](#net-manual-connect)
* [Troubleshooting](#troubleshooting)
* [Summary of Key Changes](#summary-of-key-changes)
  * [Reporting Changes](#reporting-changes)
* [References](#references)


## Common Setup Steps

Before migrating your test code, make sure the following setup is complete:

1. [Create a Playwright Workspaces resource](https://aka.ms/pww/docs/create) in the Azure Portal
2. [Manage access](https://aka.ms/pww/docs/manage-access) to control who can view and modify the workspace
3. [Update CI service connections](https://aka.ms/pww/docs/ci) to point to the new workspace

**Optional (for some scenarios):**

* [Customize regional latency](https://aka.ms/pww/docs/optimize-regional-latency) if tests need to run in specific Azure regions
* [Set up local authentication](https://aka.ms/pww/docs/authentication) if you're not using the default identity flow

## Which Scenario Applies to You?

Most users will fall under the first scenario (marked with ✅).

| Scenario                                                                                                                    | Description                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| ✅ [**Playwright Test Runner with Service Package (most common)**](#playwright-test-runner-with-service-package-most-common) | **Using `@playwright/test` with `getServiceConfig`**    |
| [Playwright Test Runner with `connectOptions`](#playwright-test-runner-with-connectoptions)                                 | Custom connection logic in `playwright.config.ts`       |
| [Node.js Manual Browser Launch](#nodejs-manual-browser-launch)                                                              | Direct use of `browser.connect()`                       |
| [.NET NUnit with Service Package](#net-nunit-with-service-package)                                                          | Using NUnit base classes with Microsoft service package |
| [.NET Manual Connect](#net-manual-connect)                                                                                  | Using `Browser.ConnectAsync` in .NET                    |


## Playwright Test Runner with Service Package (Most Common)

If you're using `@playwright/test` with `getServiceConfig` from the Microsoft service package, this is your scenario.

### Step 1: Update NPM Packages

```bash
npm uninstall @azure/microsoft-playwright-testing
npm install @azure/playwright @azure/identity
npm install @playwright/test@latest
```

### Step 2: Update `playwright.service.config.ts`

* Replace:

  ```ts
  import { getServiceConfig } from '@azure/microsoft-playwright-testing';
  ```

  with:

  ```ts
  import { createAzurePlaywrightConfig } from '@azure/playwright';
  import { DefaultAzureCredential } from '@azure/identity';
  ```

* Add the `credential`:

  ```ts
  credential: new DefaultAzureCredential()
  ```

* Remove:

  * The `runId` parameter (you may use `runName` instead)
  * Any old service reporter configuration

### Step 3: Update Environment Variables

```bash
PLAYWRIGHT_SERVICE_URL=<new_url>
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<new_token>
```

### Example Migration PR (before/after changes)

[Playwright Test Runner JS migration example](https://github.com/microsoft/playwright-testing-service/compare/users/puagarwa/migrate-playwright-workspace-jsrunner?expand=1)


## Other Scenarios

### [Playwright Test Runner with `connectOptions`](#playwright-test-runner-with-connectoptions)

Use this if you're overriding `connectOptions` in your `playwright.config.ts` or using a custom `playwright.service.config.ts`.

#### Steps

1. Follow the [Playwright Workspaces Quickstart](https://aka.ms/pww/docs/quickstart)
2. Update your `connectOptions` to use the new workspace format
3. Ensure the endpoint includes `api-version=2025-09-01`
4. Update environment variables:

```bash
PLAYWRIGHT_SERVICE_URL=<new_url>
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<new_token>
```

---

### [Node.js Manual Browser Launch](#nodejs-manual-browser-launch)

Use this if you're directly connecting to the cloud browser using `browser.connect()`.

#### Steps

1. Update your custom connection logic or fixture
2. Ensure the endpoint includes `api-version=2025-09-01`
3. Update environment variables:

```bash
PLAYWRIGHT_SERVICE_URL=<new_url>
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<new_token>
```

#### Example Migration PR (before/after changes)

[Node.js manual connect migration example](https://github.com/microsoft/playwright-testing-service/compare/users/puagarwa/migrate-nodejs-manual?expand=1)

---

### [.NET NUnit with Service Package](#net-nunit-with-service-package)

Use this if you’re using NUnit with `PageTest` and the Microsoft service package.

#### Step 1: Update NuGet Packages

```powershell
Uninstall-Package Azure.Developer.MicrosoftPlaywrightTesting.NUnit
Install-Package Azure.Developer.Playwright.NUnit
Install-Package Azure.Identity
Update-Package Microsoft.Playwright.NUnit -Version 1.50.0
```

#### Step 2: Update `PlaywrightServiceSetup.cs`

* Update `using` statements:

  ```csharp
  using Azure.Developer.Playwright.NUnit;
  using Azure.Developer.Playwright;
  using Azure.Identity;
  ```

* Update base class:

  ```csharp
  public class SetUpFixture : PlaywrightServiceBrowserNUnit
  ```

* Add:

  ```csharp
  credential: new DefaultAzureCredential()
  ```

* Remove `runId` if present (use `runName` if needed)

#### Step 3: Update Base Test Class

* Create `CloudBrowserPageTest.cs` inheriting from the new base class
* Update your test classes to inherit from it

#### Step 4: Clean Up

* Remove any logger referencing `microsoft-playwright-testing`
* Delete `.runsettings` files

#### Step 5: Update Environment Variables

```bash
PLAYWRIGHT_SERVICE_URL=<new_url>
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<new_token>
```

#### Example Migration PR (before/after changes)

[.NET NUnit migration example](https://github.com/microsoft/playwright-testing-service/compare/users/puagarwa/migrate-dotnet-nunit?expand=1)

---

### [.NET Manual Connect](#net-manual-connect)

Use this if you're calling `Browser.ConnectAsync` manually in your .NET code.

#### Steps

1. Update your custom connection logic
2. Ensure the endpoint uses `api-version=2025-09-01`
3. Update environment variables:

```bash
PLAYWRIGHT_SERVICE_URL=<new_url>
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<new_token>
```

#### Example Migration PR (before/after changes)

[.NET manual connect example](https://github.com/microsoft/playwright-testing-service/compare/users/puagarwa/migrate-dotnet-lib-manual?expand=1)


## Troubleshooting

For common migration problems and resolution tips, see:
[Migration Troubleshooting Guide](https://aka.ms/pww/migration-troubleshooting)


## Summary of Key Changes

| Area                  | Change                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource Provider** | Changed to `Microsoft.LoadTestService`                                                                                                                                |
| **Portal Management** | All resource operations now in the Azure Portal                                                                                                                       |
| **Workspace ID**      | Now a GUID (no `region_` prefix)                                                                                                                                      |

### Playwright Workspaces Reporting

Reporting is now available to all users as a part of Playwright Workspaces. You can use the [QuickStart Guide](https://aka.ms/pww-reporting) and [Troubleshooting FAQs](https://aka.ms/pww-reporting-tsg) to get started.

Share your feedback on Playwright Workspaces Reporting:  
👉 [Discussion: Built-in Reporting for Playwright Workspaces](https://github.com/azure/playwright-workspaces/issues/23)

### Package and API Changes

* `@azure/microsoft-playwright-testing` → `@azure/playwright`
* `Azure.Developer.MicrosoftPlaywrightTesting.NUnit` → `Azure.Developer.Playwright.NUnit`

**Function Renames:**

* `getServiceConfig` → `createAzurePlaywrightConfig`
* `timeout` → `connectTimeout`

**Deprecated Parameters:**

* `useCloudHostedBrowsers` — removed
* `runId` replaced with `runName`

**API Version:**

* Now `2025-09-01`


## References

* [Playwright Workspaces documentation](https://aka.ms/pww/docs)
