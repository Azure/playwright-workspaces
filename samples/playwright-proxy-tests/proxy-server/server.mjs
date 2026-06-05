/**
 * server.mjs
 *
 * The proxy container's two services:
 *   1. Public authenticated HTTP/HTTPS forward proxy on :PORT (default 8080),
 *      via `proxy-chain` with Basic auth (PROXY_USER / PROXY_PASS).
 *   2. Private origin on 127.0.0.1:9090. Bound only to loopback so it is NOT
 *      reachable from the public internet, PWW, or your laptop — only the
 *      proxy itself can tunnel CONNECT traffic to it. The Dockerfile entry
 *      adds `127.0.0.1 intranet.local` to /etc/hosts so the friendly name
 *      resolves inside the container.
 *
 * Env:
 *   PORT        listen port for the public proxy (default 8080)
 *   PROXY_USER  Basic-auth username (required)
 *   PROXY_PASS  Basic-auth password (required)
 *
 * Run locally:
 *   $env:PROXY_USER="usr"; $env:PROXY_PASS="pwd"; node server.mjs
 *
 * In production this is launched by Dockerfile + deploy-azure.ps1 on Azure
 * Container Instances. Container stdout shows every CONNECT/GET (proxy log)
 * and `[private] ...` lines whenever the private origin is hit.
 */

import http from 'node:http';
import { Server } from 'proxy-chain';

const PORT = parseInt(process.env.PORT || '8080', 10);
const USER = process.env.PROXY_USER;
const PASS = process.env.PROXY_PASS;
const PRIVATE_PORT = 9090;

if (!USER || !PASS) {
  console.error('FATAL: PROXY_USER and PROXY_PASS env vars must be set.');
  process.exit(1);
}

// --- Private origin: 127.0.0.1:9090 (loopback only) ---
const privateOrigin = http.createServer((req, res) => {
  console.log(`[private] ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Hello from the PRIVATE origin behind the proxy.',
    note: 'You are reading this because your CONNECT was tunneled by the proxy on 127.0.0.1:9090. The public internet cannot see this server.',
    receivedHost: req.headers.host,
    timestamp: new Date().toISOString(),
  }, null, 2));
});
privateOrigin.listen(PRIVATE_PORT, '127.0.0.1', () => {
  console.log(`Private origin listening on 127.0.0.1:${PRIVATE_PORT} (loopback only)`);
});

// --- Public auth proxy ---
const server = new Server({
  port: PORT,
  verbose: false,
  prepareRequestFunction: ({ request, username, password, hostname, port, isHttp }) => {
    const ok = username === USER && password === PASS;
    if (!ok) {
      return {
        requestAuthentication: true,
        failMsg: 'Bad username or password, please try again.',
      };
    }
    const srcIp = request?.socket?.remoteAddress;
    console.log(`[proxy] ${isHttp ? 'HTTP' : 'HTTPS'} ${srcIp} -> ${hostname}:${port}`);
    return { upstreamProxyUrl: null };
  },
});

server.listen(() => {
  console.log(`Authenticated proxy listening on 0.0.0.0:${PORT}`);
});

server.on('requestFailed', ({ request, error }) => {
  console.error(`[proxy] request failed: ${request?.url} - ${error.message}`);
});
