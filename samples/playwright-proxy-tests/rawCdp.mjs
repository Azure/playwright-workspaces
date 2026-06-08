/**
 * rawCdp.mjs
 * ============================================================================
 *  Sample 2 of 3 — Raw CDP (no Playwright, hand-rolled JSON-RPC)
 * ============================================================================
 *  Drives a remote Chromium on Microsoft Playwright Workspaces (PWW) over a
 *  CDP WebSocket by writing every `Target.*` / `Page.*` / `Fetch.*` frame by
 *  hand. This is what `connectOverCdp.mjs` emits under the hood — shown
 *  explicitly so the wire protocol is fully visible.
 *
 *  The proxy-auth dance, expanded:
 *    Target.createBrowserContext { proxyServer }       (context bound to proxy)
 *    Target.createTarget         { browserContextId }  (open a tab there)
 *    Target.attachToTarget       { targetId, flatten } (get a sessionId)
 *    Page.enable / Runtime.enable                      (navigate + evaluate)
 *    Fetch.enable { handleAuthRequests: true }         (intercept 407)
 *    Fetch.authRequired   ← proxy responded 407 Proxy-Authenticate
 *    Fetch.continueWithAuth { ProvideCredentials, username, password }
 *
 *  Demo runs two steps through the proxied session:
 *    1. PROXIED session -> https://api.ipify.org?format=json
 *         (shows the PROXY's egress IP)
 *    2. SAME session   -> $PROXY_ONLY_URL
 *         (fetches a URL of your choice through the proxy — e.g. a private
 *          intranet origin only reachable via your proxy)
 *
 *  Run:
 *    node rawCdp.mjs
 *
 *  Print every CDP frame sent (>>) and received (<<):
 *    $env:CDP_DEBUG=1; node rawCdp.mjs; Remove-Item env:CDP_DEBUG
 */

import { config } from 'dotenv';
config({ path: new URL('./.env', import.meta.url) });

import { getCdpEndpoint } from './pwwSessionClient.mjs';

// ─────────────────────────────────────────────────────────────────────────── //
//  Config                                                                    //
// ─────────────────────────────────────────────────────────────────────────── //

const { PROXY_SERVER, PROXY_USERNAME, PROXY_PASSWORD, PROXY_ONLY_URL } = process.env;

const IPIFY_URL = 'https://api.ipify.org?format=json';

const DEBUG = process.env.CDP_DEBUG === '1';
const trunc = (s, n = 200) => (s.length > n ? s.slice(0, n) + '…' : s);

// ─────────────────────────────────────────────────────────────────────────── //
//  Open the CDP WebSocket to PWW                                             //
//  getCdpEndpoint() asks the PWW REST API for a one-shot wss:// URL pointing //
//  at a remote Chromium's CDP socket.                                        //
// ─────────────────────────────────────────────────────────────────────────── //

const ws = new WebSocket(await getCdpEndpoint());
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

// ─────────────────────────────────────────────────────────────────────────── //
//  Tiny JSON-RPC client over the WebSocket                                   //
//  CDP frames are JSON. Requests carry numeric `id`; responses echo it.      //
//  Anything without `id` is an event we broadcast to listeners.              //
// ─────────────────────────────────────────────────────────────────────────── //

let nextId = 0;
const pending   = new Map();   // id -> resolver fn
const listeners = new Set();   // event handlers

ws.onmessage = async (ev) => {
    const text = typeof ev.data === 'string' ? ev.data : await ev.data.text();
    if (DEBUG) console.log('<<', trunc(text));
    const msg = JSON.parse(text);
    if (msg.id != null) {
        pending.get(msg.id)?.(msg);
        pending.delete(msg.id);
    } else {
        for (const fn of listeners) fn(msg);
    }
};

const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, (m) => m.error
            ? reject(new Error(`${method}: ${m.error.message}`))
            : resolve(m.result));
        const frame = JSON.stringify({ id, method, params, sessionId });
        if (DEBUG) console.log('>>', trunc(frame));
        ws.send(frame);
    });

// Convenience: wait for a single event matching (sessionId, method).
const waitForEvent = (sessionId, method) =>
    new Promise((resolve) => {
        const fn = (m) => {
            if (m.sessionId === sessionId && m.method === method) {
                listeners.delete(fn);
                resolve(m);
            }
        };
        listeners.add(fn);
    });

// ═════════════════════════════════════════════════════════════════════════ //
//  ONE-TIME SETUP                                                           //
// ═════════════════════════════════════════════════════════════════════════ //

// (a) Create the proxied browser context + a page inside it.
const { browserContextId } = await send('Target.createBrowserContext', {
    proxyServer: PROXY_SERVER,
});
const { targetId: proxiedTargetId } = await send('Target.createTarget', {
    url: 'about:blank',
    browserContextId,
});

// (b) Attach to the proxied target to get a sessionId for driving it.
//     `flatten: true` is required so messages multiplex via sessionId on the
//     single CDP socket PWW exposes per browser.
const { sessionId: proxiedSession } = await send('Target.attachToTarget', { targetId: proxiedTargetId, flatten: true });

// (c) Enable Page/Runtime so we can navigate + evaluate.
await send('Page.enable',    {}, proxiedSession);
await send('Runtime.enable', {}, proxiedSession);

// (d) Wire up proxy-auth interception. Fetch.enable pauses every request;
//     our listener provides credentials on a Proxy 407 and forwards the rest.
await send('Fetch.enable', {
    handleAuthRequests: true,
    patterns: [{ urlPattern: '*' }],
}, proxiedSession);

listeners.add((m) => {
    if (m.sessionId !== proxiedSession) return;

    if (m.method === 'Fetch.authRequired') {
        if (m.params.authChallenge.source === 'Proxy') {
            // Proxy returned 407 Proxy-Authenticate. Provide creds; Chromium
            // will retry the request with Proxy-Authorization: Basic ...
            send('Fetch.continueWithAuth', {
                requestId: m.params.requestId,
                authChallengeResponse: {
                    response: 'ProvideCredentials',
                    username: PROXY_USERNAME,
                    password: PROXY_PASSWORD,
                },
            }, proxiedSession);
        } else {
            // Origin server 401 — NEVER leak proxy creds to the target site.
            send('Fetch.continueWithAuth', {
                requestId: m.params.requestId,
                authChallengeResponse: { response: 'CancelAuth' },
            }, proxiedSession);
        }
    } else if (m.method === 'Fetch.requestPaused') {
        // Not an auth challenge: forward the request unchanged.
        send('Fetch.continueRequest', { requestId: m.params.requestId }, proxiedSession);
    }
});

// ═════════════════════════════════════════════════════════════════════════ //
//  STEP 1 — PROXIED session → ipify                                         //
//  Triggers the Fetch.authRequired / continueWithAuth dance our listener    //
//  handles. ipify reports the PROXY's egress IP.                            //
// ═════════════════════════════════════════════════════════════════════════ //

{
    const loaded = waitForEvent(proxiedSession, 'Page.loadEventFired');
    await send('Page.navigate', { url: IPIFY_URL }, proxiedSession);
    await loaded;

    const { result } = await send('Runtime.evaluate',
        { expression: 'document.body.innerText' }, proxiedSession);

    console.log('--- 1) PROXIED    -> ipify ---');
    console.log(result.value);
}

// ═════════════════════════════════════════════════════════════════════════ //
//  STEP 2 — SAME proxied session → a URL of your choice                     //
//  Customer-supplied via PROXY_ONLY_URL in .env. Use any hostname that is   //
//  reachable through your proxy.                                            //
// ═════════════════════════════════════════════════════════════════════════ //

{
    const loaded = waitForEvent(proxiedSession, 'Page.loadEventFired');
    await send('Page.navigate', { url: PROXY_ONLY_URL }, proxiedSession);
    await loaded;

    const { result } = await send('Runtime.evaluate',
        { expression: 'document.body.innerText' }, proxiedSession);

    console.log(`--- 2) PROXIED    -> ${PROXY_ONLY_URL} ---`);
    console.log(result.value);
}

ws.close();
