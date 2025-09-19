import { defineConfig } from '@playwright/test';
import { createAzurePlaywrightConfig, ServiceOS, AuthenticationType } from '@azure/playwright';
import { DefaultAzureCredential } from '@azure/identity';
import config from './playwright.config';

/* Learn more about service configuration at https://aka.ms/pww/docs/config */
export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    exposeNetwork: '<loopback>',
    connectTimeout: 3 * 60 * 1000, // 3 minutes
    os: ServiceOS.LINUX,
    credential: new DefaultAzureCredential(),
    serviceAuthType: process.env.PLAYWRIGHT_SERVICE_AUTH_TYPE as AuthenticationType || 'ENTRA_ID'
  })
);
