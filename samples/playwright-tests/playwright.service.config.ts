import { defineConfig } from '@playwright/test';
import { createAzurePlaywrightConfig, ServiceOS } from '@azure/playwright';
import { DefaultAzureCredential, AzureCliCredential } from '@azure/identity';
import config from './playwright.config';

const os = ServiceOS.LINUX;

/* Learn more about service configuration at https://aka.ms/pww/docs/config */
export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    exposeNetwork: '<loopback>',
    connectTimeout: 3 * 60 * 1000, // 3 minutes
    os: os,
    credential: new DefaultAzureCredential()
  }),
  {
    // adjust snapshotPathTemplate for remote browser OS
    snapshotPathTemplate: `{testDir}/__screenshots__/{testFilePath}/${os}/{arg}{ext}`,
  }
);
