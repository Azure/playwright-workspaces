import os
import uuid


def get_connect_options(os_name="linux", run_id=str(uuid.uuid4())) -> tuple[str, dict[str, str]]:

    service_url = os.getenv("PLAYWRIGHT_SERVICE_URL")
    service_access_token = os.getenv("PLAYWRIGHT_SERVICE_ACCESS_TOKEN")

    headers = {"Authorization": f"Bearer {service_access_token}"}
    service_run_id = os.getenv("PLAYWRIGHT_SERVICE_RUN_ID")
    ws_endpoint = f"{service_url}?os={os_name}&runId={service_run_id}&api-version=2025-09-01"

    return ws_endpoint, headers