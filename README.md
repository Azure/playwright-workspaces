# Playwright Workspaces

> ✅ **Playwright Workspaces is now Generally Available!**

[Playwright Workspaces](https://aka.ms/pww/docs) is a fully managed service for end-to-end web testing, built on top of [Playwright](https://playwright.dev). With Playwright Workspaces, you can significantly speed up test execution by running tests in parallel using managed cloud-based browers. The service takes care of the underlying infrastructure and complexity, allowing you to validate your web app across major browsers on both Linux and Windows—so you can ship features faster and with greater confidence.

👉 [Get started with the Quickstart](https://aka.ms/pww/docs/quickstart)


## Documentation

The full documentation is now available on [**learn.microsoft.com**](https://aka.ms/pww/docs)

There you’ll learn how to:

- Run and scale Playwright tests in the cloud
- Optimize test suite performance and reliability
- Test across multiple browsers and operating systems
- Set up secure, region-aware test environments
- Integrate with CI/CD

## Playwright Cloud Browsers remote MCP (preview)

The [Playwright Cloud Browsers remote MCP server](https://aka.ms/pww/mcp/docs)
gives AI agents managed cloud browsers over Streamable HTTP. Agents can create a
browser session, navigate and inspect pages, interact with elements, and close
the session without installing Playwright or a browser locally.

The remote MCP server is in **preview**, separately from the generally available
Playwright Workspaces service. Preview features do not have a service-level
agreement and are not recommended for production workloads.

### Prerequisites and authentication

You need an Azure subscription, a Playwright workspace with access to the remote
MCP preview, its region and workspace ID, and an identity with permission to use
browser sessions in that workspace.

Use the endpoint for your workspace's region:

```text
https://<region>.mcp.playwright.microsoft.com/playwrightworkspaces/<workspace-id>/mcp
```

Replace both placeholders with your workspace values. Use Microsoft Entra ID
with a client that supports OAuth discovery. The server publishes
protected-resource metadata; your signed-in identity must also have the required
workspace RBAC access. See the [authentication and setup guide](https://aka.ms/pww/mcp/docs)
for permissions and supported compatibility options. Never commit access tokens
or paste them into prompts.

### Connect from VS Code or the GitHub Copilot app

- **VS Code:** Run **MCP: Add Server** from the Command Palette, select **HTTP**,
  enter the resolved workspace endpoint, and choose a configuration destination.
  Follow the server trust and Microsoft Entra sign-in prompts. See
  [Add MCP servers in VS Code](https://code.visualstudio.com/docs/agent-customization/mcp-servers).
- **GitHub Copilot app:** Open **Customize > MCP**, add a custom server using the
  resolved workspace endpoint, and follow the supported authentication prompts.
  See [Configuring MCP servers](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app#configuring-mcp-servers).

With the server connected, ask the agent to create a browser session, open
`https://example.com`, report the page's main heading, and close the session,
including on failure. Inspect the actual MCP tool calls and outputs to verify
the connection. See the [service guide](https://aka.ms/pww/mcp/docs) for session
limits, supported tools, and troubleshooting authentication, timeouts, and
expired sessions. Report service issues through this repository's
[issue tracker](https://github.com/Azure/playwright-workspaces/issues).

### Registry metadata

The server is published as `com.microsoft/playwright-cloud-browsers` in the
[Official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/com.microsoft%2Fplaywright-cloud-browsers/versions/latest).
The root [`server.json`](./server.json) is a public copy of the published
metadata. Publication and metadata updates are managed by the service team;
changing this copy does not publish an update or establish a listing in
downstream client catalogs.

## Samples

Explore sample projects for different test runners:

- [Playwright Test with JavaScript/TypeScript](./samples/playwright-tests/)
- [NUnit with C#](./samples/.NET)
- [Python](./samples/playwright-python/)
- [Playwright Library projects](./samples/playwright-lib/)
- [Foundry Prompt Agents using Playwright Workspaces Remote MCP](./samples/remote-mcp/foundry-prompt-agents/)
- [Foundry Hosted Agents using Playwright Workspaces Remote MCP](./samples/remote-mcp/foundry-hosted-agents/)
- [App Verification Skills (verify skill)](./samples/app-verification-skills/)

## Migrating from Microsoft Playwright Testing

- See the [Migration Guide](./migration-guide.md) and [Troubleshooting Tips](./migration-troubleshooting.md)

## Issues

To report a bug, request a feature, or ask for a quote limit increase, please use the [Issues](https://github.com/Azure/playwright-workspaces/issues) section of this repository.

## More Resources

- [Documentation](https://aka.ms/pww/)
- [Pricing](https://aka.ms/pww/pricing)
- [Playwright](https://playwright.dev)