# Playwright Workspaces + Authenticated HTTP Proxy — Samples

Three runnable Node.js samples showing how to route a remote Chromium on
**Microsoft Playwright Workspaces (PWW)** through an **authenticated outbound
HTTP proxy** that you provide.

The samples are deliberately small (one file each, no test framework, no
abstraction layer) so you can read the entire request flow end to end and
copy the parts you need into your own code.

> You bring your own authenticated forward proxy. These samples only show
> how to drive PWW through one — they do not deploy a proxy for you.

---

## Folder layout

```
playwright-proxy-tests/
├── README.md                 ← you are here
├── .env.example              ← copy to .env and fill in
├── package.json              ← installs playwright + dotenv
├── connectOverCdp.mjs        ← Sample 1: Playwright over CDP (recommended)
├── rawCdp.mjs                ← Sample 2: hand-rolled CDP JSON-RPC
├── playwrightConnect.mjs     ← Sample 3: Playwright native wire protocol
└── pwwSessionClient.mjs      ← helper: gets a CDP wss:// URL from PWW
```

---

## The three samples at a glance

The three samples are **not** identical demos. They differ in (a) what wire
protocol talks to the remote browser and (b) how much of the proxy auth dance
*you* have to write. They also differ in which steps they run:

| File | Wire protocol to PWW | Proxy auth handled by | Direct step? | Proxied step? | Proxy-only URL step? |
| --- | --- | --- | :---: | :---: | :---: |
| [connectOverCdp.mjs](connectOverCdp.mjs)    | CDP (`chromium.connectOverCDP`) | Playwright (internal `Fetch.*`) | yes | yes | yes |
| [rawCdp.mjs](rawCdp.mjs)                    | CDP (raw WebSocket JSON-RPC)    | **You — `Fetch.enable` + `Fetch.continueWithAuth`** | no | yes | yes |
| [playwrightConnect.mjs](playwrightConnect.mjs) | Playwright native wire protocol (`chromium.connect`) | PWW server-side (you never see the 407) | yes | yes | yes |

The "proxy-only URL" step navigates to `PROXY_ONLY_URL` from `.env` (see
[Setup](#setup-one-time) below) — plug in any URL you want fetched through
the proxy.

---

## What each sample actually demonstrates

### 1. `connectOverCdp.mjs` — recommended

Connects with `chromium.connectOverCDP()` against a one-shot PWW CDP endpoint,
then runs:

| Step | Context | URL | Expected output |
| ---: | --- | --- | --- |
| 1 | `browser.newContext()` (no proxy) | `https://api.ipify.org` | the PWW container's egress IP |
| 2 | `browser.newContext({ proxy })`   | `https://api.ipify.org` | the **proxy's** egress IP |
| 3 | same proxied context              | `$PROXY_ONLY_URL`         | whatever your URL returns |

The proxy `407` is handled inside Playwright — your code is just
`newContext({ proxy: { server, username, password } })`.

### 2. `rawCdp.mjs` — see the protocol explicitly

No Playwright. Opens a raw WebSocket to the PWW CDP endpoint and writes every
JSON-RPC frame by hand. This is the path to use if you need to **drive PWW
from a non-Node client** (any language with a WebSocket library) or if you're
debugging exactly what Playwright is sending.

Setup frames (in order):

```
Target.createBrowserContext { proxyServer }            → browserContextId
Target.createTarget         { browserContextId, url }  → targetId
Target.attachToTarget       { targetId, flatten:true } → sessionId   (all subsequent frames carry this)
Page.enable                                              (so we can await Page.loadEventFired)
Runtime.enable                                           (so we can Runtime.evaluate)
Fetch.enable { handleAuthRequests:true, patterns:[*] }   (you now own the auth)
```

Then it runs through that proxied session:

| Step | URL | Expected output |
| ---: | --- | --- |
| 1 | `https://api.ipify.org` | the proxy's egress IP |
| 2 | `$PROXY_ONLY_URL`       | whatever your URL returns |

Run with `$env:CDP_DEBUG=1` to print every frame the script sends (`>>`) and
receives (`<<`).

### 3. `playwrightConnect.mjs` — PWW does it all

Connects with `chromium.connect()` against the **PWW service URL** (not a CDP
URL). The connection uses Playwright's native wire protocol over WebSocket,
authenticated with `Authorization: Bearer <PAT>`. No CDP frames cross your
laptop's network — PWW relays everything on the server side.

Runs the same steps as Sample 1, including the `$PROXY_ONLY_URL` step. The
observable behaviour is identical; the difference is purely the on-the-wire
protocol and where the auth dance happens (PWW relays it for you).

---

## You have to authenticate twice

Every sample performs **two** independent authentications. They are unrelated
and easy to confuse:

1. **To the remote browser host (PWW).** A Bearer access token in the
   `Authorization` header on the initial WebSocket upgrade.
   - Sample 1 (`connectOverCdp.mjs`) — the token is in the wss URL Playwright
     gets from the PWW REST API via [`pwwSessionClient.mjs`](pwwSessionClient.mjs).
   - Sample 2 (`rawCdp.mjs`) — same wss URL, opened directly with `new WebSocket(...)`.
   - Sample 3 (`playwrightConnect.mjs`) — passed via
     `chromium.connect(url, { headers: { Authorization: 'Bearer ...' } })`.
   - Lives in `PLAYWRIGHT_SERVICE_ACCESS_TOKEN` in `.env`. If this fails,
     you get `401 Authentication failed`.

2. **To the outbound HTTP proxy.** Standard HTTP Basic auth via the
   `Proxy-Authorization: Basic <base64(user:pass)>` header on every CONNECT /
   request that traverses the proxy. If it fails, the proxy returns
   `407 Proxy Authentication Required`.
   - Lives in `PROXY_USERNAME` / `PROXY_PASSWORD` in `.env`.
   - How this gets onto the wire is what differs across the three samples
     (next section).

---

## How the `407` is answered

When a proxied request hits the proxy for the first time it gets
`407 Proxy Authentication Required` with `Proxy-Authenticate: Basic`. Someone
has to retry it with `Proxy-Authorization: Basic <base64(user:pass)>`. Each
sample arranges that differently.

### Sample 1 & 3: Playwright handles it

```js
const ctx = await browser.newContext({
  proxy: { server, username, password },
});
```

Playwright registers a `Fetch.enable { handleAuthRequests: true }` handler
internally and replies to every `Fetch.authRequired` event with your
credentials when the challenge is from a proxy, or cancels otherwise. Your
code has no callbacks, no event listeners, no protocol concerns.

### Sample 2: you handle it (this is what makes raw CDP "raw")

In raw CDP there is no abstraction — `Target.createBrowserContext { proxyServer }`
**only configures which proxy to talk to**, it does NOT configure credentials.
On the very first request, Chromium gets a 407 and stops. To get past it you
have to:

1. Subscribe to the proxied session's `Fetch.*` events.
2. Enable interception with
   `Fetch.enable { handleAuthRequests: true, patterns:[{urlPattern:'*'}] }`.
3. On each `Fetch.authRequired` event, decide based on `authChallenge.source`:
   - `'Proxy'`  → reply
     `Fetch.continueWithAuth { response:'ProvideCredentials', username, password }`.
   - `'Server'` → reply `Fetch.continueWithAuth { response:'CancelAuth' }` —
     **do not send proxy creds to origin sites**; that would leak them to
     any 401 site you visit.
4. On every non-auth `Fetch.requestPaused` event, reply
   `Fetch.continueRequest { requestId }` so the request actually goes out.

If you forget step 4, every request hangs because `Fetch.enable` pauses *all*
requests, not just auth-challenged ones. If you forget the `'Server'` branch
in step 3, you ship a credential-leakage bug. The full handler is in
[rawCdp.mjs](rawCdp.mjs).

---

## Setup (one time)

You need:

- **Node.js 18+** (for built-in `WebSocket` and `fetch`).
- **A PWW workspace** + an access token (Azure portal → your Playwright Workspaces resource).
- **An authenticated HTTP proxy you control.** Point the samples at it via
  `PROXY_SERVER` / `PROXY_USERNAME` / `PROXY_PASSWORD`. To prove the proxy is
  actually in the request path, the samples compare the egress IP reported by
  `api.ipify.org` with and without the proxy — they should differ.
- **A URL to fetch through the proxy.** Set `PROXY_ONLY_URL` in `.env` to
  any hostname your proxy can reach — a private intranet origin, an
  IP-allowlisted service, or even a public URL. Each sample's final step
  navigates to it through the proxied context.

Then:

```powershell
# 1) Install dependencies
cd playwright-proxy-tests
npm install

# 2) Configure credentials
Copy-Item .env.example .env
# Edit .env and fill in:
#   PLAYWRIGHT_SERVICE_URL, PLAYWRIGHT_SERVICE_ACCESS_TOKEN,
#   PROXY_SERVER, PROXY_USERNAME, PROXY_PASSWORD, PROXY_ONLY_URL
```

> `.env` is gitignored. Never commit real credentials.

`.env` is shared by all three samples — each `.mjs` loads
`new URL('./.env', import.meta.url)` so it works from any cwd.

---

## Running the samples

```powershell
# Sample 1 — recommended high-level path
npm run sample:connect-over-cdp

# Sample 2 — raw CDP. Add CDP_DEBUG=1 to print every frame:
npm run sample:raw-cdp
$env:CDP_DEBUG=1; node rawCdp.mjs; Remove-Item env:CDP_DEBUG

# Sample 3 — Playwright native wire protocol.
# Add DEBUG=pw:* to see Playwright's outbound protocol frames:
npm run sample:playwright-connect
$env:DEBUG="pw:*"; node playwrightConnect.mjs 2>pw.log; Remove-Item env:DEBUG
```

Expected: in Samples 1 and 3, the direct step prints one IP and the proxied
step prints a different IP (the proxy's egress IP). In Sample 2, the single
proxied IP step prints the same IP as Samples 1 and 3's proxied step. The
final step in each sample prints the body of `PROXY_ONLY_URL` fetched
through the proxied context.

---

## Key facts worth knowing

- **PWW exposes one CDP WebSocket per remote browser.** Multi-session work
  (`Target.attachToTarget`) requires `flatten: true` so messages multiplex via
  `sessionId` on that single socket. See
  [crbug/40639208](https://issues.chromium.org/issues/40639208).
- **Per-context proxy is supported.** A Chromium context is bound to its
  `proxyServer` at create time. This is why all three samples can mix a
  direct context and a proxied context in the same browser (and Samples 1/3
  do exactly that).
- **Auth source matters.** On `Fetch.authRequired`, always check
  `authChallenge.source`. Provide credentials only for `'Proxy'`; cancel
  otherwise. Sending proxy credentials to an origin server is a leak.
- **`chromium.connect` vs `chromium.connectOverCDP`.** `connect` uses
  Playwright's native protocol — PWW relays everything, your laptop never
  speaks CDP. `connectOverCDP` opens a real CDP socket to the remote browser
  — your machine speaks CDP directly. Either way Chromium-level features
  (per-context proxy, etc.) behave the same.
- **Egress IPs.**
  - PWW direct → an IP from the Microsoft-owned PWW egress range (varies by region).
  - Via the proxy → the egress (SNAT) IP of your proxy.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `Authentication failed. Check your access token.` | Expired or wrong `PLAYWRIGHT_SERVICE_ACCESS_TOKEN`. Regenerate in the portal. |
| `Invalid PLAYWRIGHT_SERVICE_URL format`           | Must be `wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers`. |
| Script hangs on the first proxied navigation.     | Most common: `PROXY_USERNAME` / `PROXY_PASSWORD` don't match what the proxy was deployed with — the proxy keeps returning 407. |
| `rawCdp.mjs` hangs even though direct CDP works.  | You probably forgot to forward non-auth `Fetch.requestPaused` events with `Fetch.continueRequest`. `Fetch.enable` pauses **every** request. |
| Proxy creds appear on an origin site.             | You're answering `Fetch.authRequired` with `ProvideCredentials` regardless of `authChallenge.source`. Gate on `=== 'Proxy'`. |
| `PROXY_ONLY_URL` step hangs or 502s.              | The URL isn't reachable through your proxy (DNS, ACL, or proxy isn't tunnelling CONNECT for that host). Try the URL from a client behind the proxy first. |
| Sample 1/3 hangs on `newContext`.                 | Network can't reach PWW. Check corporate firewall lets `*.api.playwright.microsoft.com:443` through. |
| `connectOverCdp.mjs` works, `rawCdp.mjs` doesn't connect at all. | You called `Target.attachToTarget` without `flatten: true`. PWW's single-socket model requires flattened sessions. |

---

## What to read next

- The top-of-file docstring in each `.mjs` — recaps the demo steps and gives
  copy-pasteable debug commands specific to that sample.
