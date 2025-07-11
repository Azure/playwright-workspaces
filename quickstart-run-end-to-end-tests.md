---
title: 'Quickstart: Run Playwright tests at scale'
description: 'This quickstart shows how to run your Playwright tests with highly parallel cloud browsers using Playwright Workspaces. The cloud-hosted browsers support multiple operating systems and all modern browsers.'
ms.topic: quickstart
ms.date: 07/01/2025
ms.custom: playwright-workspaces-preview, build-2025
zone_pivot_group_filename: playwright-workspaces/zone-pivots-groups.json
zone_pivot_groups: playwright-workspaces
---

# Quickstart: Run end-to-end tests at scale with Playwright Workspaces

In this quickstart, you learn how to run your Playwright tests with highly parallel cloud browsers using Playwright Workspaces. Use cloud infrastructure to validate your application across multiple browsers, devices, and operating systems.

After you complete this quickstart, you have a Playwright workspace to run your Playwright tests at scale.

> [!IMPORTANT]
> Playwright Workspaces is currently in preview. For legal terms that apply to Azure features that are in beta, in preview, or otherwise not yet released into general availability, see the [Supplemental Terms of Use for Microsoft Azure Previews](https://azure.microsoft.com/support/legal/preview-supplemental-terms/).

## Prerequisites

* An Azure account with an active subscription. If you don't have an Azure subscription, create a [free account](https://azure.microsoft.com/free/?WT.mc_id=A261C142F) before you begin.
* Your Azure account needs the [Owner](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#owner), [Contributor](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#contributor), or one of the [classic administrator roles](https://learn.microsoft.com/azure/role-based-access-control/rbac-and-directory-admin-roles#classic-subscription-administrator-roles).
* A Playwright project. If you don't have project, create one by using the [Playwright getting started documentation](https://playwright.dev/docs/intro) or use our [Playwright Workspaces sample project](https://github.com/microsoft/playwright-testing-service/tree/main/samples/get-started).
* Azure CLI. If you don't have Azure CLI, see [Install Azure CLI](/cli/azure/install-azure-cli).

## Create a workspace

To get started with running your Playwright tests on cloud browsers, you first need to create a Playwright workspace.

1. Sign in to the [Azure portal](https://portal.azure.com/).

1. Select the menu button in the upper-left corner of the portal, and then select **Create a resource** a resource.

    ![Screenshot that shows the Azure portal menu to create a new resource.](./media/how-to-manage-playwright-workspace/azure-portal-create-resource.png)

1. Enter *Playwright Workspaces* in the search box.
1. Select the **Playwright Workspaces** card, and then select **Create**.

    ![Screenshot that shows the Azure Marketplace search page with the Playwright Workspaces search result.](./media/how-to-manage-playwright-workspace/azure-portal-search-playwright-resource.png)

1. Provide the following information to configure a new Playwright workspace:

    |Field  |Description  |
    |---------|---------|
    |**Subscription**     | Select the Azure subscription that you want to use for this Playwright workspace. |
    |**Resource group**     | Select an existing resource group. Or select **Create new**, and then enter a unique name for the new resource group.        |
    |**Name**     | Enter a unique name to identify your workspace.<BR>The name can only consist of alphanumerical characters, and have a length between 3 and 64 characters. |
    |**Location**     | Select a geographic location to host your workspace. <BR>This location also determines where the test execution results are stored. |

    > [!NOTE]
    > Optionally, you can configure more details on the **Tags** tab. Tags are name/value pairs that enable you to categorize resources and view consolidated billing by applying the same tag to multiple resources and resource groups.

1. After you're finished configuring the resource, select **Review + Create**.

1. Review all the configuration settings and select **Create** to start the deployment of the Playwright workspace.

    When the process has finished, a deployment success message appears.

1. To view the new workspace, select **Go to resource**.

    ![Screenshot that shows the deployment completion information in the Azure portal](./media/how-to-manage-playwright-workspace/create-resource-deployment-complete.png)


## Install Playwright Workspaces package 

::: zone pivot="playwright-test-runner"

To use the service, install the Playwright Workspaces package. 

```npm
npm init @azure/playwright@beta
```

This generates a `playwright.service.config.ts` file which serves to direct and authenticate Playwright to Playwright Workspaces.

If you already have this file, the package asks you to overwrite it. 

::: zone-end

::: zone pivot="nunit-test-runner"

To use the service, install the Playwright Workspaces package. 

```PowerShell
dotnet add package Azure.Developer.Playwright.NUnit --prerelease
```

::: zone-end

## Configure the service region endpoint

In your setup, you have to provide the region-specific service endpoint. The endpoint depends on the Azure region you selected when creating the workspace.

To get the service endpoint URL, perform the following steps:

1. Sign in to the [Azure portal](https://portal.azure.com) with your Azure account and navigate to your workspace.

1. Select the **Get Started** page.

![Screenshot that shows how to navigate to the Get Started page.](./media/quickstart-automate-end-to-end-testing/navigate-to-get-started.png)

1. In **Add region endpoint in your setup**, copy the service endpoint URL.

    Make sure this URL is available in `PLAYWRIGHT_SERVICE_URL` environment variable.

    ![Screenshot that shows how to copy the service endpoint URL.](./media/quickstart-run-end-to-end-tests/copy-service-endpoint-url.png)

::: zone pivot="playwright-test-runner"

## Set up your environment

To set up your environment, you have to configure the `PLAYWRIGHT_SERVICE_URL` environment variable with the value you obtained in the previous steps.

We recommend that you use the `dotenv` module to manage your environment. With `dotenv`, you define your environment variables in the `.env` file.

1. Add the `dotenv` module to your project:

    ```shell
    npm i --save-dev dotenv
    ```

1. Create a `.env` file alongside the `playwright.config.ts` file in your Playwright project:

    ```
    PLAYWRIGHT_SERVICE_URL={MY-REGION-ENDPOINT}
    ```

    Make sure to replace the `{MY-REGION-ENDPOINT}` text placeholder with the value you copied earlier.

::: zone-end

::: zone pivot="nunit-test-runner"
## Set up service configuration 

Create a file `PlaywrightServiceSetup.cs` in your project with the following content. 

```csharp
using Azure.Developer.Playwright.NUnit;
using Azure.Identity;

namespace PlaywrightTests; // Remember to change this as per your project namespace

[SetUpFixture]
public class PlaywrightServiceNUnitSetup  : PlaywrightServiceBrowserNUnit
{
    public PlaywrightServiceNUnitSetup() : base(
        credential: new DefaultAzureCredential()
    ) 
    {}
}
```

> [!NOTE]
> Make sure your project uses `Microsoft.Playwright.NUnit` version 1.47 or above.

::: zone-end
## Set up Authentication

To run your Playwright tests in your Playwright workspace, you need to authenticate the Playwright client where you're running the tests with the service. This could be your local dev machine or CI machine. 

The service offers two authentication methods: Microsoft Entra ID and Access Tokens.

Microsoft Entra ID uses your Azure credentials, requiring a sign-in to your Azure account for secure access. Alternatively, you can generate an access token from your Playwright workspace and use it in your setup.

##### Set up authentication using Microsoft Entra ID 

Microsoft Entra ID is the default and recommended authentication for the service. From your local dev machine, you can use [Azure CLI](/cli/azure/install-azure-cli) to sign-in

```CLI
az login
```
> [!NOTE]
> If you're a part of multiple Microsoft Entra tenants, make sure you sign in to the tenant where your workspace belongs. You can get the tenant ID from Azure portal. See [Find your Microsoft Entra Tenant](https://learn.microsoft.com/azure/azure-portal/get-subscription-tenant-id#find-your-microsoft-entra-tenant). Once you get the ID, sign-in using the command `az login --tenant <TenantID>`

##### Set up authentication using access tokens

You can generate an access token from your Playwright workspace and use it in your setup. However, we strongly recommend Microsoft Entra ID for authentication due to its enhanced security. Access tokens, while convenient, function like long-lived passwords and are more susceptible to being compromised.

1. Authentication using access tokens is disabled by default. To use, [Enable access-token based authentication](./how-to-manage-authentication.md#enable-authentication-using-access-tokens)

2. [Set up authentication using access tokens](./how-to-manage-authentication.md#set-up-authentication-using-access-tokens)

> [!CAUTION]
> We strongly recommend using Microsoft Entra ID for authentication to the service. If you are using access tokens, see [How to Manage Access Tokens](./how-to-manage-access-tokens.md)


## Run your tests at scale with Playwright Workspaces

::: zone pivot="playwright-test-runner"

You've now prepared the configuration for running your Playwright tests in the cloud with Playwright Workspaces. You can either use the Playwright CLI to run your tests, or use the [Playwright Test Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright).

### Run a single test with the service

With Playwright Workspaces, you get charged based on the number of total test minutes. If you're a first-time user or [getting started with a free trial](./how-to-try-playwright-workspaces-free.md), you might start with running a single test instead of your full test suite to avoid exhausting your free trial limits.

After you validate that the test runs successfully, you can gradually increase the test load by running more tests with the service.

Perform the following steps to run a single Playwright test with Playwright Workspaces:

# [Playwright CLI](#tab/playwrightcli)

To use the Playwright CLI to run your tests with Playwright Workspaces, pass the service configuration file as a command-line parameter.

1. Open a terminal window.

1. Enter the following command to run your Playwright test on remote browsers in your workspace:

    Replace the `{name-of-file.spec.ts}` text placeholder with the name of your test specification file.

    ```bash
    npx playwright test {name-of-file.spec.ts} --config=playwright.service.config.ts
    ```

    After the test completes, you can view the test status in the terminal.

    ```output
    Running 1 test using 1 worker
        1 passed (2.2s)
    
    To open last HTML report run:
    
    npx playwright show-report
    ```

# [Visual Studio Code](#tab/vscode)

To run a single Playwright test in Visual Studio Code with Playwright Workspaces, select the service configuration file in the **Test Explorer** view. Then select and run the test from the list of tests.

1. Install the [Playwright Test Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright).

1. Open the **Test Explorer** view in the activity bar.

    The test explorer automatically detects your Playwright tests and the service configuration in your project.

    ![Screenshot of Visual Studio Code Test Explorer.](./media/quickstart-run-end-to-end-tests/visual-studio-code-test-explorer.png)

1. Select **Select Default Profile**, and then select your default projects from the service configuration file.

    Notice that the service run profiles are coming from the `playwright.service.config.ts` file you added previously.

    By setting a default profile, you can automatically run your tests with the service, or run multiple Playwright projects simultaneously.

    ![Screenshot of choosing the default run profile in Visual Studio Code](./media/quickstart-run-end-to-end-tests/visual-studio-code-choose-run-profile.png)

1. From the list of tests, select the **Run test** button next to a test to run it.

    The test runs on the projects you selected in the default profile. If you selected one or more projects from the service configuration, the test runs on remote browsers in your workspace.

    ![Screenshot of running a single test in Visual Studio Code](./media/quickstart-run-end-to-end-tests/visual-studio-code-run-test.png)

    > [!TIP]
    > You can still debug your test code when you run your tests on remote browsers by using the **Debug test** button.

1. You can view the test results directly in Visual Studio Code.

    ![Screenshot of test results in Visual Studio Code.](./media/quickstart-run-end-to-end-tests/visual-studio-code-test-results.png)

---

You can now run multiple tests with the service, or run your entire test suite on remote browsers.

> [!CAUTION]
> Depending on the size of your test suite, you might incur additional charges for the test minutes and test results beyond your allotted free test minutes and free test results.

### Run a full test suite with the service

Now that you've validated that you can run a single test with Playwright Workspaces, you can run a full Playwright test suite at scale.

Perform the following steps to run a full Playwright test suite with Playwright Workspaces:

# [Playwright CLI](#tab/playwrightcli)

When you run multiple Playwright tests or a full test suite with Playwright Workspaces, you can optionally specify the number of parallel workers as a command-line parameter.

1. Open a terminal window.

1. Enter the following command to run your Playwright test suite on remote browsers in your workspace:

    ```bash
    npx playwright test --config=playwright.service.config.ts --workers=20
    ```

    Depending on the size of your test suite, this command runs your tests on up to 20 parallel workers.

    After the test completes, you can view the test status in the terminal.

    ```output
    Running 6 tests using 6 workers
        6 passed (18.2s)
    ```

# [Visual Studio Code](#tab/vscode)

To run your Playwright test suite in Visual Studio Code with Playwright Workspaces:

1. Open the **Test Explorer** view in the activity bar.

1. Select the **Run tests** button to run all tests with Playwright Workspaces.

    When you run all tests, the default profile is used. In the previous step, you configured the default profile to use projects from the service configuration.

    ![Screenshot of how to run all tests from Test Explorer Visual Studio Code.](./media/quickstart-run-end-to-end-tests/visual-studio-code-run-all-tests.png)

    > [!TIP]
    > You can still debug your test code when you run your tests on remote browsers by using the **Debug tests** button.

1. Alternately, you can select a specific service configuration from the list to only run the tests for a specific browser configuration.

    ![Screenshot of how to select a specific project to run tests against in Visual Studio Code](./media/quickstart-run-end-to-end-tests/visual-studio-code-run-all-tests-select-project.png)

1. You can view all test results in the **Test results** tab.

---
::: zone-end

::: zone pivot="nunit-test-runner"

Run Playwright tests against browsers managed by the service using the configuration you created above. 

```bash
dotnet test -- NUnit.NumberOfTestWorkers=20
```

After the test run completes, you can view the test status in the terminal.


```output
Starting test execution, please wait...

A total of 100 test files matched the specified pattern.

Passed!  - Failed:     0, Passed:     100, Skipped:     0, Total:     100, Duration: 59 s - PlaywrightTestsNUnit.dll (net7.0)

Workload updates are available. Run `dotnet workload list` for more information.
```
::: zone-end

## Optimize parallel worker configuration

Once your tests are running smoothly with the service, experiment with varying the number of parallel workers to determine the optimal configuration that minimizes test completion time.

With Playwright Workspaces, you can run with up to 50 parallel workers. Several factors influence the best configuration for your project, such as the CPU, memory, and network resources of your client machine, the target application's load-handling capacity, and the type of actions carried out in your tests.

::: zone pivot="playwright-test-runner"
You can specify the number of parallel workers on the Playwright CLI command-line, or configure the `workers` property in the Playwright service configuration file.
::: zone-end

::: zone pivot="nunit-test-runner"
You can specify the number of parallel workers on the Playwright CLI command-line, or configure the `NumberOfTestWorkers` property in the `.runsettings` file.
::: zone-end

Learn more about how to [determine the optimal configuration for optimizing test suite completion](./concept-determine-optimal-configuration.md).

## Next step

You've successfully created a Playwright workspace in the Azure portal and run your Playwright tests on cloud browsers.

Advance to the next quickstart to set up continuous end-to-end testing by running your Playwright tests in your CI/CD workflow.

> [!div class="nextstepaction"]
> [Set up continuous end-to-end testing in CI/CD](./quickstart-automate-end-to-end-testing.md)
