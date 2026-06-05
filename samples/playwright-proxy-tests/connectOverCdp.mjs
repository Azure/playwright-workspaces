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
 *    3. SAME proxied ctx -> http://intranet.local:9090/
 *         (private origin only reachable through the proxy — proof the
 *          tunnel works end to end)
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

const { PROXY_SERVER, PROXY_USERNAME, PROXY_PASSWORD } = process.env;

const IPIFY_URL    = 'https://api.ipify.org?format=json';
const INTRANET_URL = 'http://intranet.local:9090/';

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
const proxiedPage1   = await proxiedContext.newPage();

await proxiedPage1.goto(IPIFY_URL);
const proxiedBody1 = await proxiedPage1.locator('body').innerText();

console.log('--- 2) PROXIED    -> ipify ---');
console.log(proxiedBody1);

// ═════════════════════════════════════════════════════════════════════════ //
//  STEP 3 — SAME proxied context → private intranet origin                  //
//  `intranet.local:9090` is a loopback service running INSIDE the proxy     //
//  container. It is unreachable from the public internet. We can hit it     //
//  only because the proxy is tunnelling our CONNECT for that hostname.     //
// ═════════════════════════════════════════════════════════════════════════ //

const proxiedPage2 = await proxiedContext.newPage();

await proxiedPage2.goto(INTRANET_URL);
const proxiedBody2 = await proxiedPage2.locator('body').innerText();

console.log('--- 3) PROXIED    -> intranet ---');
console.log(proxiedBody2);

await proxiedContext.close();
await browser.close();
