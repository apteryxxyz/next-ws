import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { findWorkspaceRoot } from './workspace';

const TracePath = path.join(
  findWorkspaceRoot(),
  'node_modules/next/.next-ws-trace.json',
);

interface Trace {
  patch: string;
  version: string;
}

export function getTrace() {
  try {
    return JSON.parse(readFileSync(TracePath, 'utf8')) as Trace;
  } catch {
    return null;
  }
}

export function setTrace(trace: Trace) {
  try {
    writeFileSync(TracePath, JSON.stringify(trace, null, 2));
    return true;
  } catch {
    return false;
  }
}
