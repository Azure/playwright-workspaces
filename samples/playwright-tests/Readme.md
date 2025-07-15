# Example of playwright test project with Playwright service workspace

## How to use this example
- clone repo
- Create a Playwright workspace by following the [Getting Started guide](https://aka.ms/pww/docs/manage-workspaces)
- create playwright workspace by following [getting started](https://aka.ms/pww/docs/manage-workspaces)
- follow [Configure Service Endpoint](https://aka.ms/pww/docs/configure-service-endpoint) and set regional endpoint env variable
```
$env:PLAYWRIGHT_SERVICE_URL="wss://...."
```
- az login
- Run test suite
```
# The --workers=20 flag runs tests in parallel using 20 workers; adjust this number based on your machine's CPU and memory for optimal performance.
npx playwright test --config=playwright.service.config.ts --workers=20
```
