import argparse
import asyncio
import os
from urllib.parse import urlsplit, urlunsplit

from agent_framework import Agent
from agent_framework.foundry import FoundryChatClient, FoundryToolbox
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import MCPToolboxTool
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv


def require_environment_variable(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"{name} must be set.")
    return value


def get_mcp_server_url(playwright_service_url: str) -> str:
    service_url = urlsplit(playwright_service_url)
    expected_host_suffix = ".api.playwright.microsoft.com"

    if service_url.scheme != "wss":
        raise ValueError("PLAYWRIGHT_SERVICE_URL must use the wss scheme.")
    if not service_url.hostname or not service_url.hostname.endswith(
        expected_host_suffix
    ):
        raise ValueError(
            "PLAYWRIGHT_SERVICE_URL must use a *.api.playwright.microsoft.com host."
        )

    service_path = service_url.path.rstrip("/")
    if not service_path.endswith("/browsers"):
        raise ValueError("PLAYWRIGHT_SERVICE_URL path must end with /browsers.")

    region = service_url.hostname.removesuffix(expected_host_suffix)
    mcp_host = f"{region}.mcp.playwright.microsoft.com"
    mcp_path = f"{service_path.removesuffix('/browsers')}/mcp"
    return urlunsplit(("https", mcp_host, mcp_path, "", ""))


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run a Foundry Hosted Agent with Playwright remote MCP tools."
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        default="Open https://playwright.dev and report the page title.",
        help="Browser task for the agent.",
    )
    args = parser.parse_args()

    load_dotenv()

    project_endpoint = require_environment_variable(
        "FOUNDRY_PROJECT_ENDPOINT"
    ).rstrip("/")
    require_environment_variable("FOUNDRY_MODEL")
    service_url = require_environment_variable("PLAYWRIGHT_SERVICE_URL")
    access_token = require_environment_variable("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")
    mcp_server_url = get_mcp_server_url(service_url)

    credential = DefaultAzureCredential()
    project = AIProjectClient(endpoint=project_endpoint, credential=credential)
    toolbox = None

    try:
        toolbox = project.toolboxes.create_version(
            name="playwright-browser-automation-toolbox",
            description="Toolbox with Playwright Workspaces browser automation.",
            tools=[
                MCPToolboxTool(
                    server_label="playwright-browser-automation",
                    server_url=mcp_server_url,
                    headers={"x-api-key": access_token},
                    require_approval="always",
                )
            ],
        )
        toolbox_mcp_url = (
            f"{project_endpoint}/toolboxes/{toolbox.name}"
            f"/versions/{toolbox.version}/mcp?api-version=v1"
        )
        toolbox_tool = FoundryToolbox(credential, url=toolbox_mcp_url)
        print(
            f"Created toolbox {toolbox.name} version {toolbox.version} "
            f"with MCP server {mcp_server_url}"
        )
        async with Agent(
            client=FoundryChatClient(credential=credential),
            instructions=(
                "Use the Playwright browser automation MCP tools to complete browser "
                "tasks. Prefer inspecting the page before acting and report the result "
                "concisely."
            ),
            tools=[toolbox_tool],
        ) as agent:
            result = await agent.run(args.prompt)
            print(f"\nAgent: {result.text}")
    finally:
        try:
            if toolbox is not None:
                project.toolboxes.delete_version(
                    name=toolbox.name,
                    version=toolbox.version,
                )
        finally:
            try:
                project.close()
            finally:
                credential.close()
        if toolbox is not None:
            print("Deleted the toolbox version.")


if __name__ == "__main__":
    asyncio.run(main())
