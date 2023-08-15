import * as fs from 'node:fs';
import * as path from 'node:path';
import { log } from '../utilities/log';
import { findWorkspaceRoot } from '../utilities/workspace';
import { patchNextNodeServer } from './patch-1';

const WorkspaceRoot = findWorkspaceRoot();

const NextTypesFilePath = path.join(
  WorkspaceRoot,
  'node_modules/next/dist/build/webpack/plugins/next-types-plugin/index.js'
);
const NextTypesPatch = 'SOCKET?: Function';

// Add `SOCKET?: Function` to the page module interface check field thing in
// `next/dist/build/webpack/plugins/next-types-plugin/index.js`
export function patchNextTypesPlugin() {
  log.info("Adding 'SOCKET' to the page module interface type...");
  const content = fs.readFileSync(NextTypesFilePath, 'utf8');
  if (content.includes(NextTypesPatch)) return;

  const toFind = '.map((method)=>`${method}?: Function`).join("\\n  ")';
  const replaceWith = `${toFind} + "; SOCKET?: Function"`;

  const newContent = content.replace(toFind, replaceWith);
  fs.writeFileSync(NextTypesFilePath, newContent);
}

export default Object.assign(
  () => {
    patchNextNodeServer();
    patchNextTypesPlugin();
  },
  {
    date: '2023-07-15' as const,
    // The file for 'next-types-plugin' was moved in 13.4.9
    supported: '>=13.4.9 <=13.4.12' as const,
  }
);
