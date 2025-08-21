import { defineConfig } from '@playwright/test';

export default defineConfig({
  workers: process.env.CI ? 1 : undefined,
  testDir: 'tests',
  reporter: [['html', { outputFolder: 'tests/.report' }]],
  retries: 1,
  use: { trace: 'on-first-retry' },
  outputDir: 'tests/.results',
  webServer: [
    {
      name: '[custom-server]',
      cwd: 'examples/custom-server',
      command: 'pnpm dev',
      env: { PORT: '3003' },
      port: 3003,
      reuseExistingServer: !process.env.CI,
    },
    {
      name: '[chat-room]',
      cwd: 'examples/chat-room',
      command: 'pnpm dev --port 3001',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      name: '[base-path]',
      cwd: 'examples/base-path',
      command: 'pnpm dev --port 3002',
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
