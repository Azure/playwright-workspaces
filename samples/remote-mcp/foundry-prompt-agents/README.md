# Foundry Prompt Agent with Playwright remote MCP

This sample creates a server-hosted [Microsoft Foundry Prompt Agent](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol?pivots=python) and connects it to the Playwright Service browser automation remote MCP endpoint. The agent sends the Playwright Service access token in the `x-api-key` header and asks for approval before every browser tool call.

## Prerequisites

- A Microsoft Foundry project with a deployed model
- The **Foundry User** role on the Foundry project
- A [Playwright Workspace](https://aka.ms/pww/docs) and Playwright Service access token
- Python 3.10 or later
- Azure CLI authentication (`az login`)

## Configure the sample

1. Install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

1. Set these values in `.env`:

   ```dotenv
   FOUNDRY_PROJECT_ENDPOINT=https://<account>.services.ai.azure.com/api/projects/<project>
   FOUNDRY_MODEL_DEPLOYMENT_NAME=<model-deployment-name>
   PLAYWRIGHT_SERVICE_URL=wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspace-id>/browsers
   PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<access-token>
   ```

`DefaultAzureCredential` authenticates to Foundry. For local development, run `az login` before starting the sample.

## How the MCP URL is derived

The sample converts the Playwright browser service URL into the corresponding remote MCP URL:

```text
wss://eastus.api.playwright.microsoft.com/playwrightworkspaces/9b02898e-4c07-41fd-b59c-61a93ed7fdc6/browsers
  ↓
https://eastus.mcp.playwright.microsoft.com/playwrightworkspaces/9b02898e-4c07-41fd-b59c-61a93ed7fdc6/mcp
```

The conversion changes:

- the scheme from `wss` to `https`
- the host from `<region>.api.playwright.microsoft.com` to `<region>.mcp.playwright.microsoft.com`
- the final path segment from `/browsers` to `/mcp`

The resulting MCP tool configuration is equivalent to:

```python
MCPTool(
    server_label="playwright-browser-automation",
    server_url=mcp_server_url,
    headers={"x-api-key": playwright_service_access_token},
    require_approval="always",
)
```

## Run the agent

Run the default task:

```bash
python playwright_mcp_agent.py
```

Or provide a browser task:

```bash
python playwright_mcp_agent.py "Open https://playwright.dev, follow the Get started link, and summarize the page."
```

The script displays each requested MCP tool call and its arguments. Enter `y` only when the server, tool, and arguments match the action you expect. When the task finishes, the script deletes the conversation and agent version.

## Resources

- [Connect agents to MCP server endpoints](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol?pivots=python)
- [Playwright Workspaces documentation](https://aka.ms/pww/docs)
