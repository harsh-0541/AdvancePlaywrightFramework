import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

function resolveBaseURL(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const env = (process.env.TTA_ENV || 'qa').toLowerCase();
  switch (env) {
    case 'api':
      return process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
    case 'dev':
    case 'local':
      return process.env.DEV_BASE_URL || 'http://localhost:3000';
    case 'stg':
    case 'stage':
    case 'staging':
      return process.env.STG_BASE_URL || 'https://stage.thetestingacademy.com';
    case 'prod':
    case 'production':
      return process.env.PROD_BASE_URL || 'https://app.thetestingacademy.com';
    case 'qa':
    default:
      return process.env.QA_BASE_URL || 'https://app.thetestingacademy.com';
  }
}

export default defineConfig({
  testDir: './src/tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['html'],
    ['list'],
    // ['./src/utils/CustomReporter.ts'] — still blocked: needs
    // src/ai/agents/rcaAgent.ts, src/ai/agents/flakyAnalyzer.ts,
    // src/ai/config/providers.ts, which don't exist yet.
  ],

  use: {
    baseURL: resolveBaseURL(),
    trace: 'on',
    screenshot: 'on',
    video: 'on'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* {
       name: 'firefox',
       use: { ...devices['Desktop Firefox'] },
     },
 
     {
       name: 'webkit',
       use: { ...devices['Desktop Safari'] },
     },
 
     /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
