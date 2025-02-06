import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  reporter: [['html', { outputFolder: 'tests/.report' }]],
  retries: 1,
  use: { trace: 'on-first-retry' },
  outputDir: 'tests/.results',
  webServer: [
    {
      cwd: 'examples/chat-room',
      command: 'pnpm dev --port 3001',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      cwd: 'examples/chat-room-with-custom-server',
      command: 'pnpm dev --port 3002',
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
