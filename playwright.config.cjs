const { defineConfig, devices } = require('@playwright/test');
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5080';

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  globalTimeout: 10 * 60_000,
  expect: { timeout: 5_000 },
  outputDir: './reports/artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/playwright', open: 'never' }],
    ['json', { outputFile: './reports/playwright-results.json' }],
    ['junit', { outputFile: './reports/junit.xml' }],
  ],
  snapshotPathTemplate: '{testDir}/baselines/{platform}/{projectName}/{arg}{ext}',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  webServer: process.env.USE_EXTERNAL_SERVER === '1' ? undefined : {
    command: process.env.TEST_SERVER_COMMAND ||
      'dotnet run --project apps/backend/DateTimeChecker.Api.csproj --no-launch-profile --urls http://127.0.0.1:5080',
    url: new URL('/api/health', baseURL).href,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      DOTNET_CLI_TELEMETRY_OPTOUT: '1',
      Logging__LogLevel__Default: 'Warning',
      Logging__LogLevel__Microsoft: 'Warning',
    },
  },
  projects: [
    { name: 'api', testDir: './tests/api' },
    { name: 'web-chromium', testDir: './tests/web-e2e', use: { ...devices['Desktop Chrome'] } },
    { name: 'web-firefox', testDir: './tests/web-e2e', use: { ...devices['Desktop Firefox'] } },
    { name: 'web-webkit', testDir: './tests/web-e2e', use: { ...devices['Desktop Safari'] } },
    { name: 'visual-chromium', testDir: './tests/visual', use: { ...devices['Desktop Chrome'] } },
    { name: 'ui-performance-chromium', testDir: './tests/performance', use: { ...devices['Desktop Chrome'] } },
  ],
});
