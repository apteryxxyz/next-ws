#!/usr/bin/env node

import program from './commands';
program.parse([], process.argv.slice(2));
