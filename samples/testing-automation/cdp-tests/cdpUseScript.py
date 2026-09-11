"""
cdp-use over PWW

Drives a remote Chromium on Microsoft Playwright Service using the low-level
`cdp-use` Python CDP client.

----------------------------------------
Install
----------------------------------------
pip install cdp-use python-dotenv aiohttp

----------------------------------------
Required env vars
----------------------------------------
PLAYWRIGHT_SERVICE_URL
PLAYWRIGHT_SERVICE_ACCESS_TOKEN

----------------------------------------
Run
----------------------------------------
python cdpUseScript.py
"""

import asyncio
import os
from typing import Optional

from cdp_use.client import CDPClient
from dotenv import load_dotenv

from playwright_service_client import get_cdp_endpoint

load_dotenv()


async def main():
    cdp_url = await get_cdp_endpoint()

    async with CDPClient(cdp_url) as client:
        ctx = await client.send.Target.createBrowserContext()
        target = await client.send.Target.createTarget(
            params={"url": "about:blank", "browserContextId": ctx["browserContextId"]}
        )
        session = await client.send.Target.attachToTarget(
            params={"targetId": target["targetId"], "flatten": True}
        )
        session_id = session["sessionId"]

        load_event = asyncio.Event()

        def on_load(event, sid: Optional[str]) -> None:
            load_event.set()

        client.register.Page.loadEventFired(on_load)

        await client.send.Page.enable(session_id=session_id)
        await client.send.Runtime.enable(session_id=session_id)

        await client.send.Page.navigate(
            params={"url": "https://example.com"}, session_id=session_id
        )
        await load_event.wait()

        result = await client.send.Runtime.evaluate(
            params={"expression": "document.title"}, session_id=session_id
        )
        print("Page title:", result["result"]["value"])


# Opt-in proxy variant. Not invoked by default — change the entry point at
# the bottom of this file to `main_with_proxy()` to use it. Requires
# PROXY_SERVER / PROXY_USERNAME / PROXY_PASSWORD in your env.
#
# cdp-use does not abstract proxy auth, so we enable Fetch interception
# and answer Fetch.authRequired ourselves with Fetch.continueWithAuth.
async def main_with_proxy():
    cdp_url = await get_cdp_endpoint()

    async with CDPClient(cdp_url) as client:
        ctx = await client.send.Target.createBrowserContext(
            params={"proxyServer": os.environ["PROXY_SERVER"]}
        )
        target = await client.send.Target.createTarget(
            params={"url": "about:blank", "browserContextId": ctx["browserContextId"]}
        )
        session = await client.send.Target.attachToTarget(
            params={"targetId": target["targetId"], "flatten": True}
        )
        session_id = session["sessionId"]

        load_event = asyncio.Event()

        async def on_auth(event, sid: Optional[str]) -> None:
            if event["authChallenge"]["source"] == "Proxy":
                await client.send.Fetch.continueWithAuth(
                    params={
                        "requestId": event["requestId"],
                        "authChallengeResponse": {
                            "response": "ProvideCredentials",
                            "username": os.environ["PROXY_USERNAME"],
                            "password": os.environ["PROXY_PASSWORD"],
                        },
                    },
                    session_id=sid,
                )
            else:  # never leak proxy creds to origin servers
                await client.send.Fetch.continueWithAuth(
                    params={
                        "requestId": event["requestId"],
                        "authChallengeResponse": {"response": "CancelAuth"},
                    },
                    session_id=sid,
                )

        async def on_paused(event, sid: Optional[str]) -> None:
            await client.send.Fetch.continueRequest(
                params={"requestId": event["requestId"]}, session_id=sid
            )

        def on_load(event, sid: Optional[str]) -> None:
            load_event.set()

        # cdp-use awaits any awaitable a handler RETURNS, on its single
        # receive loop. If we awaited a client.send(...) inside the handler
        # (or returned the coroutine/Task), that loop would block waiting for
        # a reply it can't read yet -> deadlock. So schedule the async work as
        # a background task and return None.
        def on_auth_handler(event, sid: Optional[str]) -> None:
            asyncio.create_task(on_auth(event, sid))

        def on_paused_handler(event, sid: Optional[str]) -> None:
            asyncio.create_task(on_paused(event, sid))

        client.register.Fetch.authRequired(on_auth_handler)
        client.register.Fetch.requestPaused(on_paused_handler)
        client.register.Page.loadEventFired(on_load)

        await client.send.Page.enable(session_id=session_id)
        await client.send.Runtime.enable(session_id=session_id)
        await client.send.Fetch.enable(
            params={
                "handleAuthRequests": True,
                "patterns": [{"urlPattern": "*"}],
            },
            session_id=session_id,
        )

        await client.send.Page.navigate(
            params={"url": "https://example.com"}, session_id=session_id
        )
        await load_event.wait()

        result = await client.send.Runtime.evaluate(
            params={"expression": "document.title"}, session_id=session_id
        )
        print("Page title (via proxy):", result["result"]["value"])


if __name__ == "__main__":
    asyncio.run(main())
