/**
 * pwwSessionClient.mjs
 *
 * Tiny helper: asks Microsoft Playwright Workspaces (PWW) for a one-shot
 * wss:// CDP endpoint, given PLAYWRIGHT_SERVICE_URL + PLAYWRIGHT_SERVICE_ACCESS_TOKEN.
 *
 * Imported by `rawCdp.mjs` and `connectOverCdp.mjs`. Not meant to be run directly.
 *
 * Usage:
 *   import { getCdpEndpoint } from './pwwSessionClient.mjs';
 *   const cdpUrl = await getCdpEndpoint();
 *   const browser = await chromium.connectOverCDP(cdpUrl);
 */

export class PlaywrightServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PlaywrightServiceError';
  }
}

function parseServiceUrl(url) {
  const match = url.match(/wss:\/\/(\w+)\.api\.playwright\.microsoft\.com\/playwrightworkspaces\/([^/]+)\/browsers/);
  if (!match) {
    throw new PlaywrightServiceError(
      `Invalid PLAYWRIGHT_SERVICE_URL format: ${url}\n` +
      'Expected: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers'
    );
  }
  return { region: match[1], workspaceId: match[2] };
}

export async function getCdpEndpoint(serviceUrl = null, accessToken = null, osName = 'Linux') {
  serviceUrl = serviceUrl || process.env.PLAYWRIGHT_SERVICE_URL;
  accessToken = accessToken || process.env.PLAYWRIGHT_SERVICE_ACCESS_TOKEN;

  if (!serviceUrl) {
    throw new PlaywrightServiceError(
      'PLAYWRIGHT_SERVICE_URL environment variable is not set.\n' +
      'Expected: wss://<region>.api.playwright.microsoft.com/playwrightworkspaces/<workspaceId>/browsers'
    );
  }
  if (!accessToken) {
    throw new PlaywrightServiceError('PLAYWRIGHT_SERVICE_ACCESS_TOKEN environment variable is not set.');
  }

  const { region, workspaceId } = parseServiceUrl(serviceUrl);

  const apiUrl = `https://${region}.api.playwright.microsoft.com/playwrightworkspaces/${workspaceId}/browsers?os=${osName}&browser=chromium&playwrightVersion=cdp&shouldRedirect=false`;

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
  };

  const response = await fetch(apiUrl, { headers });

  if (response.status === 401) {
    throw new PlaywrightServiceError('Authentication failed. Check your access token.');
  }
  if (response.status === 403) {
    throw new PlaywrightServiceError('Access forbidden. Check your permissions.');
  }
  if (!response.ok) {
    const text = await response.text();
    throw new PlaywrightServiceError(`Failed to get browser endpoint: HTTP ${response.status}\n${text}`);
  }

  const data = await response.json();
  const correlationId = new URL(data.sessionUrl).searchParams.get('correlationId');
  console.log('PWW session (correlationId):', correlationId);
  return data.sessionUrl;
}
