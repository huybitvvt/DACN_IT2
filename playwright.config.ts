import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  // Hai Edge instance cùng Argon2, Vite và Docker gây nhiễu trên máy demo.
  // Có thể tăng bằng E2E_WORKERS trên CI/server có tài nguyên riêng.
  workers: Number(process.env.E2E_WORKERS ?? '1'),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev:client',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'desktop-edge',
      use: {
        channel: 'msedge',
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile-edge',
      use: {
        ...devices['Pixel 7'],
        channel: 'msedge',
      },
    },
  ],
});
