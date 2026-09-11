# Launching the app (and discovering its ACTUAL URL)

The configured `baseURL` (in `playwright.config.ts`, README, or user input) is a *hint*. The dev server's own stdout is the *truth*.

## The invariant

When you start the app, the port / host it actually binds to may differ from what the config says — the configured port might be occupied, the dev server might auto-bump, or it might prompt the shell for a new port and wait on input. After kicking off the dev script:

- Start it async with a `shellId` so you can read its output and send keystrokes if it asks for input.
- Read the server's stdout to find the URL it actually bound to. Use that URL, not the config's `baseURL`.
- If `baseURL` in `playwright.config.ts` doesn't match the discovered URL, **update it** before any browser session opens.
- Verify the discovered URL is reachable once before Phase 1.

## Why this matters more for `/verify`

Cloud browsers reach the local app via the loopback tunnel — they connect to exactly the URL in `baseURL`. A wrong URL produces silent timeouts (not errors). If Phase 1 stalls on the first navigate, re-read the dev-server shell output first — the actual URL is in there.
