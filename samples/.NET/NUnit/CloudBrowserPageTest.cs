using Microsoft.Playwright.NUnit;
using Azure.Developer.Playwright;
using Azure.Identity;
using Microsoft.Playwright;

namespace PlaywrightTests;      // Remember to change this as per your project namespace
public class CloudBrowserPageTest : PageTest
{
    public override async Task<(string, BrowserTypeConnectOptions?)?> ConnectOptionsAsync()
    {
        // Check env variable to decide whether to use Azure Playwright or not
        var disableAzurePlaywright = Environment.GetEnvironmentVariable("DISBALE_AZURE_PLAYWRIGHT");
        if (!string.IsNullOrEmpty(disableAzurePlaywright) && disableAzurePlaywright.Equals("true", StringComparison.OrdinalIgnoreCase))
        {
            // If disabled, fall back to base implementation (if any) or return null
            // If base.PageTest does not implement ConnectOptionsAsync, just return null
            // set PLAYWRIGHT_SERVICE_ACCESS_TOKEN to null to avoid falling to remote connection
            Environment.SetEnvironmentVariable("PLAYWRIGHT_SERVICE_ACCESS_TOKEN", null);
            return null;
        }
        PlaywrightServiceBrowserClient client = new PlaywrightServiceBrowserClient(
            credential: new DefaultAzureCredential(),
            options: new PlaywrightServiceBrowserClientOptions
            {
                ServiceAuth = ServiceAuthType.EntraId // optional
            });
        var connectOptions = await client.GetConnectOptionsAsync<BrowserTypeConnectOptions>();
        return (connectOptions.WsEndpoint, connectOptions.Options);
    }
}
