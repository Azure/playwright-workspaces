# Example Playwright Library Project with Service Workspace
# How to use this example
- Clone the repo and go to the folder
- npm install
- Create a Playwright workspace by following the [Getting Started guide](https://aka.ms/pww/docs/manage-workspaces)
- Follow the [Getting Started guidance](https://aka.ms/pww/docs/configure-service-endpoint) and set the regional endpoint environment variable
```
$env:PLAYWRIGHT_SERVICE_URL="wss://...."
```
- Generate access token following [guide](https://aka.ms/pww/docs/generate-access-token)
- Set the token generated in the previous step
```
$env:PLAYWRIGHT_SERVICE_ACCESS_TOKEN="TOKEN_VALUE"
```
- Generate a guid and set to environment variable PLAYWRIGHT_RUN_ID
```
$env:PLAYWRIGHT_RUN_ID="your_guid"
```

- Run the example script
```
npx ts-node src/example.ts
```

- Test Runs get updated at 5 min interval, so check current test run details after 5 min of running script.

## Optional: route the run through an authenticated HTTP proxy

The default [`src/example.ts`](./src/example.ts) talks to PWW directly. If you
need every BrowserContext to go through an authenticated forward proxy, use
the opt-in [`src/example-proxy.ts`](./src/example-proxy.ts) instead. It adds a
`proxy` option to `browser.newContext()`; Playwright handles the 407
challenge for you.

```powershell
$env:PROXY_SERVER   = "http://<your-proxy>:8080"
$env:PROXY_USERNAME = "<user>"
$env:PROXY_PASSWORD = "<password>"
$env:PROXY_ONLY_URL = "http://intranet.example/healthcheck"

npx ts-node src/example-proxy.ts
```