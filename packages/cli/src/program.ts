#!/usr/bin/env node
import { program } from 'commander';
import patchCommand from './commands/patch';

program
  .name('next-ws')
  .description('Patch the local Next.js installation to support WebSockets')
  .addCommand(patchCommand)
  .parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
