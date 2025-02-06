import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  reporter: [['html', { outputFolder: 'tests/.report' }]],
  outputDir: 'tests/.results',
});
