# Authenticated HTTP Proxy on Azure

A minimal Node.js forward proxy with HTTP Basic auth, packaged for Azure
Container Instances (ACI). Sits between a browser (local, or on
Playwright Workspaces) and the public internet — or a private origin
bundled inside the same container.

Two services run inside the container:

| Service              | Port             | Reachable from                                           |
| -------------------- | ---------------- | -------------------------------------------------------- |
| Authenticated proxy  | `8080` (public)  | anywhere on the internet (needs user/pass)               |
| Private origin       | `9090` (loopback)| only from inside the container — i.e. only via the proxy |

The private origin is what makes the demo provable: `http://intranet.local:9090`
resolves to `127.0.0.1` **inside** the container only (see `Dockerfile`).
The public internet has no route to it. If a remote browser can read it, the
only way it got there is by tunneling through the proxy.

---

## Files

| File                  | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `server.mjs`          | The proxy + the private origin (single process)    |
| `Dockerfile`          | Container image, injects `intranet.local` host     |
| `package.json`        | Deps: `proxy-chain`                                |
| `deploy-azure.ps1`    | One-shot Azure deploy: ACR build → ACI run         |
| `.dockerignore`       | Skip `node_modules` etc. when building             |

---

## Prerequisites

- An Azure subscription with permission to create ACR + ACI in a resource group.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az --version`).
- (Optional, only for running locally) Node 18+.

You do **not** need Docker installed — the image is built in the cloud by ACR.

---

## Deploy to Azure (recommended)

```powershell
az login

.\deploy-azure.ps1 `
  -ResourceGroup "<your-rg>" `
  -ProxyUser     "<your-user>" `
  -ProxyPass     "<your-strong-password>"
```

Optional flags: `-Location <region>`, `-AppName <name>`, `-Port <port>` (default `8080`).

The script will:

1. Reuse the resource group if it exists, else create it.
2. Create an Azure Container Registry, build the image in the cloud (`az acr build`).
3. Tear down any previous container with the same name.
4. Deploy to Azure Container Instances with a deterministic DNS label
   (re-running the script gives you the same FQDN, so your `.env` doesn't churn).
5. Print the final FQDN, IP, port, and a ready-to-paste smoke test.

Sample output:

```
==============================================
 Proxy deployed.
 FQDN : <your-app>-<hash>.<region>.azurecontainer.io
 IP   : <public-ip>
 Port : 8080
 User : <your-user>
==============================================
```

Smoke test:

```powershell
curl.exe -x "http://<user>:<pass>@<fqdn>:8080" https://example.com -I
```

Expected: `HTTP/1.1 200 OK` from `example.com`, plus a line in the container
log: `[proxy] HTTPS <yourIp> -> example.com:443`.

---

## How clients use it

Set these three values in the project root `.env` (see `../.env.example`):

```
PROXY_SERVER   = http://<fqdn>:8080
PROXY_USERNAME = <your-user>
PROXY_PASSWORD = <your-password>
```

### Playwright (per-context)
```js
const context = await browser.newContext({
  proxy: {
    server:   process.env.PROXY_SERVER,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
  },
});
```

### Raw CDP (`Target.createBrowserContext`)
```js
const { browserContextId } = await send('Target.createBrowserContext', {
  proxyServer: process.env.PROXY_SERVER,
});
// Authenticate via Fetch.enable + Fetch.continueWithAuth
```

### curl
```powershell
curl.exe -x "http://<user>:<pass>@<fqdn>:8080" https://example.com
```

---

## Behaviour

- **HTTP**: proxy receives the full request, forwards it, returns the response.
  Logged as `[proxy] HTTP <src> -> <host>:<port>`.
- **HTTPS**: client sends `CONNECT host:443`, proxy authenticates, opens a TCP
  tunnel; all traffic after that is end-to-end TLS — the proxy only sees the
  hostname. Logged as `[proxy] HTTPS <src> -> <host>:<port>`.
- **Bad credentials**: returns `407 Proxy Authentication Required` with the
  message `Bad username or password, please try again.` Nothing is forwarded.
- **No destination filtering**: once authenticated, any destination is allowed.
  Treat the credentials as a shared secret — anyone with them can browse the
  internet via your ACI egress IP.
- **Egress IP**: the public IP of the ACI instance (the script prints it).
  Target sites see that IP, not the caller's IP, not Playwright Workspaces.

---

## The internal "private origin"

For demo / validation purposes only:

- An `http.createServer` inside `server.mjs` listens on `127.0.0.1:9090`.
- The Dockerfile appends `127.0.0.1 intranet.local` to `/etc/hosts` inside the
  container, so `http://intranet.local:9090` resolves to that loopback server
  **only when DNS is performed inside the container**.
- When a remote browser sends `CONNECT intranet.local:9090` to the proxy, the
  proxy resolves the hostname locally and tunnels to itself. The browser gets
  the JSON payload.
- Anyone trying to hit `http://intranet.local:9090` *without* going through the
  proxy gets nothing — there is no public route.

This is the proof: if a Playwright test running on remote Playwright
Workspaces browsers can read the JSON, the only path it could have taken is
through this proxy.

---

## Run locally (optional, for development)

```powershell
npm install
$env:PROXY_USER="usr"; $env:PROXY_PASS="pwd"; $env:PORT="8080"
node server.mjs
```

Test:

```powershell
curl.exe -x "http://usr:pwd@127.0.0.1:8080" https://example.com -I
```

---

## Logs

Stream container logs:
```powershell
az container logs -g <your-rg> -n pw-proxy --follow
```

You should see one line per request:
```
[proxy] HTTPS 20.x.x.x -> example.com:443
[proxy] HTTPS 20.x.x.x -> intranet.local:9090
[private] GET / from 127.0.0.1
```

---

## Tear down

```powershell
az container delete -g <your-rg> -n pw-proxy --yes
az acr list -g <your-rg> --query "[?starts_with(name,'pwproxyacr')].name" -o tsv |
  ForEach-Object { az acr delete -g <your-rg> -n $_ --yes }
```

---

## Security notes

- Credentials travel in the `Proxy-Authorization` header. The hop from client
  to proxy is **plaintext HTTP** on port 8080 — anyone on the path can sniff
  the proxy creds. For production, front this with TLS (e.g. Caddy / Nginx /
  Application Gateway terminating HTTPS for the proxy URL itself, or run it
  inside a VNet and access via Private Link).
- Rotate `ProxyPass` regularly; it's the only thing protecting your egress IP
  from being used by strangers.
- The script stores `PROXY_PASS` as a `--secure-environment-variables` on the
  container (not visible in `az container show`). It is still visible to anyone
  with `Contributor` on the resource group.
