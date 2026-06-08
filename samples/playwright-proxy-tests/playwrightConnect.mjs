/**
 * playwrightConnect.mjs
 * ============================================================================
 *  Sample 3 of 3 — Playwright's native wire protocol (no CDP on the wire)
 * ============================================================================
 *  Drives a remote Chromium on Microsoft Playwright Workspaces (PWW) via
 *  Playwright's NATIVE wire protocol (not CDP). `chromium.connect()` is
 *  pointed at the PWW service URL with a Bearer-token Authorization header.
 *  PWW relays `browser.newContext({ proxy })` to the remote Chromium and the
 *  proxy-auth handshake (Fetch.* frames) is performed entirely server-side.
 *  From this laptop we never see a CDP frame.
 *
 *  Demo runs three steps:
 *    1. DIRECT  context -> https://api.ipify.org?format=json
 *         (shows the PWW container's public egress IP)
 *    2. PROXIED context -> https://api.ipify.org?format=json
 *         (shows the PROXY's egress IP — request went through the proxy)
 *    3. SAME proxied ctx -> $PROXY_ONLY_URL
 *         (fetches a URL of your choice through the proxy — e.g. a private
 *          intranet origin only reachable via your proxy)
 *
 *  Run:
 *    node playwrightConnect.mjs
 *
 *  See the Playwright wire-protocol frames being sent:
 *    $env:DEBUG="pw:*"; node playwrightConnect.mjs 2>pw.log; Remove-Item env:DEBUG
 *    Select-String pw.log -Pattern "newContext|setNetworkProxy|proxyServer" -Context 0,1
 */

import { config } from 'dotenv';
config({ path: new URL('./.env', import.meta.url) });

import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

// ─────────────────────────────────────────────────────────────────────────── //
//  Config                                                                    //
// ─────────────────────────────────────────────────────────────────────────── //

const {
    PLAYWRIGHT_SERVICE_URL,             // wss://<region>.api.playwright.microsoft.com/...
    PLAYWRIGHT_SERVICE_ACCESS_TOKEN,    // PAT issued from the PWW portal
    PROXY_SERVER,
    PROXY_USERNAME,
    PROXY_PASSWORD,
    PROXY_ONLY_URL,
} = process.env;

const IPIFY_URL = 'https://api.ipify.org?format=json';

const PROXY = {
    server:   PROXY_SERVER,
    username: PROXY_USERNAME,
    password: PROXY_PASSWORD,
};

// PWW wire-protocol query string. `runId` is a per-session UUID, `os` picks
// the remote container image, `api-version` pins the contract.
const API_VERSION = '2025-09-01';
const OS_NAME     = 'linux';
const wsEndpoint  =
    `${PLAYWRIGHT_SERVICE_URL}` +
    `?runId=${encodeURIComponent(randomUUID())}` +
    `&os=${OS_NAME}` +
    `&api-version=${API_VERSION}`;

// ─────────────────────────────────────────────────────────────────────────── //
//  Connect to PWW over the Playwright wire protocol                          //
//  Auth is a Bearer token in the Authorization header — no CDP socket open.  //
// ─────────────────────────────────────────────────────────────────────────── //

const browser = await chromium.connect(wsEndpoint, {
    headers: { Authorization: `Bearer ${PLAYWRIGHT_SERVICE_ACCESS_TOKEN}` },
    timeout: 3 * 60 * 1000,
});

// ═════════════════════════════════════════════════════════════════════════ //
//  STEP 1 — DIRECT context → ipify                                          //
//  No `proxy` option => Chromium reaches the internet directly from the     //
//  PWW container. ipify returns the container's public egress IP.           //
// ═════════════════════════════════════════════════════════════════════════ //

const directContext = await browser.newContext();
const directPage    = await directContext.newPage();

await directPage.goto(IPIFY_URL);
const directBody = await directPage.locator('body').innerText();

console.log('--- 1) DIRECT     -> ipify ---');
console.log(directBody);

await directContext.close();

// ═════════════════════════════════════════════════════════════════════════ //
//  STEP 2 — PROXIED context → ipify                                         //
//  PWW relays the `proxy` setting to the remote browser; proxy 407 auth is  //
//  handled server-side. ipify now reports the PROXY's egress IP.            //
// ═════════════════════════════════════════════════════════════════════════ //

const proxiedContext = await browser.newContext({ proxy: PROXY });
const proxiedPage    = await proxiedContext.newPage();

await proxiedPage.goto(IPIFY_URL);
const proxiedBody = await proxiedPage.locator('body').innerText();

console.log('--- 2) PROXIED    -> ipify ---');
console.log(proxiedBody);

// ═════════════════════════════════════════════════════════════════════════ //
//  STEP 3 — SAME proxied context → a URL of your choice                     //
//  Customer-supplied via PROXY_ONLY_URL in .env. Use any hostname that is   //
//  reachable through your proxy.                                            //
// ═════════════════════════════════════════════════════════════════════════ //

const proxyOnlyPage = await proxiedContext.newPage();
await proxyOnlyPage.goto(PROXY_ONLY_URL);
const proxyOnlyBody = await proxyOnlyPage.locator('body').innerText();

console.log(`--- 3) PROXIED    -> ${PROXY_ONLY_URL} ---`);
console.log(proxyOnlyBody);

await proxiedContext.close();
await browser.close();
