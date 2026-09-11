# Run Playwright .NET tests with Playwright Workspace 

This sample demonstrates how to run Playwright .NET tests at scale using Playwright Workspace. It showcases the benefits of accelerating test suite completion by leveraging more parallel cloud browsers. The tests are executed using NUnit test runner.

Note: Since service integration is done via [playwright NUnit base class](https://playwright.dev/dotnet/docs/test-runners) which uses BrowserService so it only works out of the box when you use one of the following base class BrowserTest, Page, ContextTest

If you have not yet created a workspace, please follow the [Get Started guide](../../../../README.md#get-started)

### Sample setup
1. Clone this sample:
    ```powershell
    git clone https://github.com/Azure/playwright-workspaces/
    cd playwright-workspaces/samples/testing-automation/.NET/NUnit
    ```

1. Install dependencies:
    ```powershell
    dotnet add package Microsoft.Playwright.NUnit
    ```
1. Install service package
   ```powershell
   dotnet add package Azure.Developer.Playwright.NUnit
   ```
   
1. Build the project so the playwright.ps1 is available inside the bin directory:
    ```powershell
    dotnet build
    ```

1. Install required browsers by replacing netX with the actual output folder name, e.g. net6.0:

    ```powershell
    pwsh bin/Debug/netX/playwright.ps1 install
    ```

    If pwsh is not available, you have to [install PowerShell](https://docs.microsoft.com/powershell/scripting/install/installing-powershell).

1. Set up Authentication 

    To run your Playwright tests in your Playwright Workspace, you need to authenticate the Playwright client where you are running the tests with the service. This could be your local dev machine or CI machine. To run tests from your local machine, you can use Azure CLI. Run this command to sign-in 
    
    ```CLI
    az login
    ```
    **NOTE**: If you are a part of multiple Microsoft Entra tenants, make sure you sign-in to the tenant where your workspace belongs. You can get the tenant id from Azure portal, see [Find your Microsoft Entra Tenant](https://learn.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id#find-your-microsoft-entra-tenant). Once you get the id, sign in using the command `az login --tenant <TenantID>`

1. Set up environment: 
   In the [Azure portal](https://portal.azure.com), Navigate to workspace and Getting Started tab, copy the command under **Add region endpoint in your set up** and set the following environment variable:

   ```bash
   PLAYWRIGHT_SERVICE_URL= # Paste region endpoint URL
    ```
   
### Run tests

Run Playwright tests against browsers managed by the service using the configuration you created above. You can run up to 50 parallel workers with the service
```powershell
    dotnet test -- NUnit.NumberOfTestWorkers=20
```
Note that by default NUnit will run all test files in parallel, while running tests inside each file sequentially (ParallelScope.Self). You can adjust this behavior using the NUnit.NumberOfTestWorkers parameter. Running test in parallel using ParallelScope.All or ParallelScope.Fixtures is not supported. Please refer to [Playwright documentation](https://playwright.dev/dotnet/docs/test-runners#running-nunit-tests-in-parallel). 

   
## Next steps
1. Follow the [quickstart guide](TBD)
2. [Integrate CI/CD pipelines](TBD)
3. Learn about [package options](TBD).
4. Sample for updating params [Custom option](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/loadtestservice/Azure.Developer.Playwright.NUnit/samples/Sample2_CustomisingServiceParameters.md)

### Details of the files on this sample project
- [PlaywrightServiceSetup.cs](./PlaywrightServiceSetup.cs): **Requiried** to be added to your project to setup the service, make sure to change the namespace to your project namespace
- [CloudBrowserPageTest.cs](./CloudBrowserPageTest.cs): **Required** to be added to your project to Override builtin PageTest fixture with Azure Playwright cloud browser connection and use CloudBrowserPageTest in all test classes. You need to update your existing test classes to use CloudBrowserPageTest instead of PageTest as base class.


### How to extend new fixtures
- public class Tests : CloudBrowserPageTest // for PageTest fixture

### How to add custom param in service
Follow the sample [here](https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/loadtestservice/Azure.Developer.Playwright.NUnit/samples/Sample2_CustomisingServiceParameters.md)
