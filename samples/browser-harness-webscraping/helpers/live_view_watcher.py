"""
LiveViewWatcher — polls Playwright Workspaces for new browser sessions
and auto-opens the LiveView URL for real-time debugging.

Usage:
    from helpers.live_view_watcher import LiveViewWatcher

    watcher = LiveViewWatcher(pw_client, workspace_id, credential, auth_token)
    watcher.start()
    # ... run your browser automation ...
    watcher.stop()
"""

import threading
import webbrowser
from urllib.parse import quote


class LiveViewWatcher:
    """Polls Playwright Service for new browser sessions and
    auto-opens the live viewer when one is detected."""

    LIVE_VIEW_BASE_URL = "https://stcnttestdataknarayasea.z23.web.core.windows.net/live_viewer_pww.html"

    def __init__(self, pw_client, workspace_id, credential, auth_token,
                 auth_service_base=None, poll_interval=2):
        """
        Args:
            pw_client: PlaywrightClient instance
            workspace_id: PWW workspace ID
            credential: Azure credential (for future token refresh)
            auth_token: JWT access token for the live viewer
            auth_service_base: Base URL of the auth service (derived from dataplane_uri)
            poll_interval: Seconds between polling attempts
        """
        self.pw_client = pw_client
        self.workspace_id = workspace_id
        self.credential = credential
        self.auth_token = auth_token
        self.auth_service_base = auth_service_base or ""
        self.poll_interval = poll_interval
        self.stop_event = threading.Event()
        self.session_id = None
        self.thread = None
        self.existing_sessions = set()

    def _build_live_url(self, session_id):
        """Construct the PWW live viewer URL with all required params."""
        return (
            f"{self.LIVE_VIEW_BASE_URL}"
            f"?session={quote(session_id)}"
            f"&workspace={quote(self.workspace_id)}"
            f"&authBase={quote(self.auth_service_base)}"
            f"&token={quote(self.auth_token)}"
        )

    def start(self):
        """Snapshot existing sessions and start polling in background."""
        try:
            self.existing_sessions = set(
                s.id for s in self.pw_client.browser_sessions.list(self.workspace_id)
            )
        except Exception:
            self.existing_sessions = set()
        self.stop_event.clear()
        self.session_id = None
        self.thread = threading.Thread(target=self._poll, daemon=True)
        self.thread.start()

    def stop(self):
        """Signal stop, wait briefly for the session to appear."""
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=10)

    def _poll(self):
        while True:
            try:
                current = set(
                    s.id for s in self.pw_client.browser_sessions.list(self.workspace_id)
                )
                new_sessions = current - self.existing_sessions
                if new_sessions:
                    self.session_id = new_sessions.pop()
                    live_url = self._build_live_url(self.session_id)
                    print(f"\n  [LiveView] Session detected: {self.session_id}")
                    print(f"  [LiveView] Opening browser...")
                    webbrowser.open(live_url)
                    return
            except Exception:
                pass
            if self.stop_event.wait(self.poll_interval):
                # Final check before exiting
                try:
                    current = set(
                        s.id for s in self.pw_client.browser_sessions.list(self.workspace_id)
                    )
                    new_sessions = current - self.existing_sessions
                    if new_sessions:
                        self.session_id = new_sessions.pop()
                        live_url = self._build_live_url(self.session_id)
                        print(f"\n  [LiveView] Session detected: {self.session_id}")
                        print(f"  [LiveView] Opening browser...")
                        webbrowser.open(live_url)
                except Exception:
                    pass
                return
