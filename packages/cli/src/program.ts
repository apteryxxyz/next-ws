#!/usr/bin/env node

// eslint-disable-next-line n/shebang
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
