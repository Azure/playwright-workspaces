/**
 * connectOverCdp.mjs
 * ============================================================================
 *  Sample 1 of 3 — Playwright over CDP (recommended high-level path)
 * ============================================================================
 *  Drives a remote Chromium on Microsoft Playwright Workspaces (PWW) using
 *  Playwright's high-level `chromium.connectOverCDP()`. Playwright internally
 *  emits the same `Target.*` / `Fetch.*` CDP frames you can see in
 *  `rawCdp.mjs`, but you write a single `browser.newContext({ proxy })` call
 *  instead of handcrafting the protocol.
 *
 *  This is the path most customers should use.
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
 *    node connectOverCdp.mjs
 *
 *  See the CDP frames Playwright is sending under the hood:
 *    $env:DEBUG = "pw:protocol"; node connectOverCdp.mjs *> cdp.log; Remove-Item env:DEBUG
 *    Select-String cdp.log -Pattern "createBrowserContext|Fetch.authRequired|continueWithAuth" -Context 0,1
 */

import { config } from 'dotenv';
config({ path: new URL('./.env', import.meta.url) });

import { chromium } from 'playwright';
import { getCdpEndpoint } from './pwwSessionClient.mjs';

// ─────────────────────────────────────────────────────────────────────────── //
//  Config                                                                    //
// ─────────────────────────────────────────────────────────────────────────── //

const { PROXY_SERVER, PROXY_USERNAME, PROXY_PASSWORD, PROXY_ONLY_URL } = process.env;

const IPIFY_URL = 'https://api.ipify.org?format=json';

const PROXY = {
    server:   PROXY_SERVER,     // e.g. http://<your-proxy-fqdn>:8080
    username: PROXY_USERNAME,
    password: PROXY_PASSWORD,
};

// ─────────────────────────────────────────────────────────────────────────── //
//  Connect to PWW over CDP                                                   //
//  getCdpEndpoint() asks the PWW REST API for a one-shot wss:// URL.         //
// ─────────────────────────────────────────────────────────────────────────── //

const cdpEndpoint = await getCdpEndpoint();
const browser     = await chromium.connectOverCDP(cdpEndpoint);

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
//  Passing `proxy` to newContext makes Chromium route every request from    //
//  this context through the authenticated HTTP proxy. ipify now reports     //
//  the PROXY's egress IP, not the container's.                              //
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
//  reachable through your proxy (private intranet, IP-allowlisted service,  //
//  etc.).                                                                   //
// ═════════════════════════════════════════════════════════════════════════ //

const proxyOnlyPage = await proxiedContext.newPage();
await proxyOnlyPage.goto(PROXY_ONLY_URL);
const proxyOnlyBody = await proxyOnlyPage.locator('body').innerText();

console.log(`--- 3) PROXIED    -> ${PROXY_ONLY_URL} ---`);
console.log(proxyOnlyBody);

await proxiedContext.close();
await browser.close();
