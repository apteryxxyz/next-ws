import * as fs from 'node:fs';
import * as path from 'node:path';
import generate from '@babel/generator';
import * as parser from '@babel/parser';
import template from '@babel/template';
import type * as bt from '@babel/types';
import { log } from '../utilities/log';
import { findWorkspaceRoot } from '../utilities/workspace';

const WorkspaceRoot = findWorkspaceRoot();

const NextServerFilePath = path.join(
  WorkspaceRoot,
  'node_modules/next/dist/server/next-server.js'
);
const NextServerPatch = 'require("next-ws/server")';

const NextTypesFilePath = path.join(
  WorkspaceRoot,
  'node_modules/next/dist/build/webpack/plugins/next-types-plugin.js'
);
const NextTypesPatch = 'SOCKET?: Function';

// Add `require('next-ws/server').setupWebSocketServer(this)` to the
// constructor of `NextNodeServer` in `next/dist/server/next-server.js`
export function patchNextNodeServer() {
  log.info(
    'Adding WebSocket server setup script to NextNodeServer constructor...'
  );
  const content = fs.readFileSync(NextServerFilePath, 'utf8');
  if (content.includes(NextServerPatch)) return;

  const tree = parser.parse(content);

  const classDeclaration = tree.program.body.find(
    (node) =>
      node.type === 'ClassDeclaration' && node.id.name === 'NextNodeServer'
  ) as bt.ClassDeclaration | undefined;
  if (!classDeclaration) return;

  const constructorMethod = classDeclaration.body.body.find(
    (node) => node.type === 'ClassMethod' && node.kind === 'constructor'
  ) as bt.ClassMethod | undefined;
  if (!constructorMethod) return;

  const statement = template.statement
    .ast`${NextServerPatch}.setupWebSocketServer(this)`;
  constructorMethod.body.body.push(statement);

  fs.writeFileSync(NextServerFilePath, generate(tree).code);
}

// Add `SOCKET?: Function` to the page module interface check field thing in
// `next/dist/build/webpack/plugins/next-types-plugin.js`
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
    date: '2023-06-16' as const,
    supported: '>=13.1.1 <=13.4.8' as const,
  }
);
