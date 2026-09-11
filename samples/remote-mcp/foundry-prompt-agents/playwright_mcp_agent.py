import argparse
import json
import os
from urllib.parse import urlsplit, urlunsplit

from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import MCPTool, PromptAgentDefinition
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv
from openai.types.responses import Response
from openai.types.responses.response_input_param import (
    McpApprovalResponse,
    ResponseInputParam,
)


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
    if not service_url.hostname or not service_url.hostname.endswith(expected_host_suffix):
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


def request_approval(response: Response) -> ResponseInputParam:
    approvals: ResponseInputParam = []

    for item in response.output:
        if item.type != "mcp_approval_request" or not item.id:
            continue

        print("\nMCP tool approval requested:")
        print(f"  Server: {item.server_label}")
        print(f"  Tool: {getattr(item, 'name', '<unknown>')}")
        print(
            f"  Arguments: "
            f"{json.dumps(getattr(item, 'arguments', None), indent=2, default=str)}"
        )
        approved = input("Approve this tool call? [y/N]: ").strip().lower() == "y"
        approvals.append(
            McpApprovalResponse(
                type="mcp_approval_response",
                approve=approved,
                approval_request_id=item.id,
            )
        )

    return approvals


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run a Foundry Prompt Agent with Playwright remote MCP tools."
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        default="Open https://playwright.dev and report the page title.",
        help="Browser task for the agent.",
    )
    args = parser.parse_args()

    load_dotenv()

    project_endpoint = require_environment_variable("FOUNDRY_PROJECT_ENDPOINT")
    model_deployment = require_environment_variable("FOUNDRY_MODEL_DEPLOYMENT_NAME")
    service_url = require_environment_variable("PLAYWRIGHT_SERVICE_URL")
    access_token = require_environment_variable("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")
    mcp_server_url = get_mcp_server_url(service_url)

    credential = DefaultAzureCredential()
    project = AIProjectClient(endpoint=project_endpoint, credential=credential)
    openai = project.get_openai_client()
    agent = None
    conversation = None

    try:
        tool = MCPTool(
            server_label="playwright-browser-automation",
            server_url=mcp_server_url,
            headers={"x-api-key": access_token},
            require_approval="always",
        )
        agent = project.agents.create_version(
            agent_name="playwright-browser-agent",
            definition=PromptAgentDefinition(
                model=model_deployment,
                instructions=(
                    "Use the Playwright browser automation MCP tools to complete browser "
                    "tasks. Prefer inspecting the page before acting and report the result "
                    "concisely."
                ),
                tools=[tool],
            ),
        )
        print(
            f"Created agent {agent.name} version {agent.version} "
            f"with MCP server {mcp_server_url}"
        )
        conversation = openai.conversations.create()
        response = openai.responses.create(
            conversation=conversation.id,
            input=args.prompt,
            extra_body={
                "agent_reference": {
                    "name": agent.name,
                    "type": "agent_reference",
                }
            },
        )

        while approvals := request_approval(response):
            response = openai.responses.create(
                input=approvals,
                previous_response_id=response.id,
                extra_body={
                    "agent_reference": {
                        "name": agent.name,
                        "type": "agent_reference",
                    }
                },
            )

        print(f"\nAgent: {response.output_text}")
    finally:
        try:
            if conversation is not None:
                openai.conversations.delete(conversation.id)
        finally:
            try:
                if agent is not None:
                    project.agents.delete_version(
                        agent_name=agent.name,
                        agent_version=agent.version,
                    )
            finally:
                credential.close()
        if agent is not None:
            print("Deleted the conversation and agent version.")


if __name__ == "__main__":
    main()
