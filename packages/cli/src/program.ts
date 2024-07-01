#!/usr/bin/env node

import { program } from 'commander';
import patchCommand from './commands/patch';
import verifyCommand from './commands/verify';

program
  .name('next-ws')
  .description('Patch the local Next.js installation to support WebSockets')
  .addCommand(patchCommand)
  .addCommand(verifyCommand)
  .parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
