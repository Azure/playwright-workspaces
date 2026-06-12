# Using Playwright Test Runner with Playwright Workspaces

This sample demonstrates how to run Playwright tests using cloud-hosted browsers provided by [Playwright Workspace](https://aka.ms/pww/docs).

## How to Use this Sample

1. **Clone this repository and navigate to the sample**

    ```bash
    git clone https://github.com/Azure/playwright-workspaces.git
    cd playwright-workspaces/samples/playwright-tests
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Create a Playwright Workspace**  
   Follow the [Getting Started guide](https://aka.ms/pww/docs/quickstart) to create your workspace.

4. **Set the Playwright Service endpoint**

    - **macOS / Linux**:

        ```bash
        export PLAYWRIGHT_SERVICE_URL="wss://<your-service-endpoint>"
        ```

    - **Windows PowerShell**:

        ```powershell
        $env:PLAYWRIGHT_SERVICE_URL = "wss://<your-service-endpoint>"
        ```

5. **Authenticate with Azure**

    ```bash
    az login
    ```

6. **Run the full test suite using the Playwright Workspaces configuration**

    ```bash
    npx playwright test --config=playwright.service.config.ts --workers=20
    ```

    > 💡 Adjust the `--workers` value based on your system resources and workspace quota. Use `--workers=1` when debugging or running locally.

    To run a single test file:
    ```
    npx playwright test tests/example.spec.ts --config=playwright.service.config.ts
    ```

## Optional: route tests through an authenticated HTTP proxy

If your tests need to reach a private origin via an authenticated forward
proxy, use the opt-in `proxy` project defined in [`playwright.config.ts`](./playwright.config.ts).
It points `testDir` at [`./tests-proxy`](./tests-proxy) and adds `use.proxy`,
so the default `npx playwright test` command and the existing `tests/` specs
are unaffected.

1. Set the proxy env vars (in addition to `PLAYWRIGHT_SERVICE_URL`):

    ```powershell
    $env:PROXY_SERVER   = "http://<your-proxy>:8080"
    $env:PROXY_USERNAME = "<user>"
    $env:PROXY_PASSWORD = "<password>"
    $env:PROXY_ONLY_URL = "http://intranet.example/healthcheck"
    ```

    `PROXY_ONLY_URL` is the URL [`tests-proxy/proxy.spec.ts`](./tests-proxy/proxy.spec.ts)
    navigates to so traffic actually traverses the proxy — pick a private
    origin reachable only through your proxy (spec is skipped if unset).

2. Run only the proxy project:

    ```bash
    npx playwright test --config=playwright.service.config.ts --project=proxy
    ```

Playwright handles the proxy 407 challenge using the credentials in `use.proxy`.

## Need Help?

If you run into issues, open an issue in this repository or refer to the [Playwright Workspaces documentation](https://aka.ms/pww/docs).
