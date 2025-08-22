#!/usr/bin/env node

import program from './commands/index.js';

program.parse([], process.argv.slice(2));
