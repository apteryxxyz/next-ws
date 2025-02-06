import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  reporter: [['html', { outputFolder: 'tests/.reports' }]],
  outputDir: 'tests/.results',
});
