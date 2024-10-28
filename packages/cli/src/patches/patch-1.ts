import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import generate from '@babel/generator';
import * as parser from '@babel/parser';
import template from '@babel/template';
import type { ClassDeclaration, ClassMethod } from '@babel/types';
import logger from '~/helpers/logger';
import { findNextDirectory } from '~/helpers/next';

// Add `require('next-ws/server').setupWebSocketServer(this)` to the constructor of
// NextNodeServer in next/dist/server/next-server.js
// REMARK: Starting the server and handling connections is part of the core package

const NextServerFilePath = join(
  findNextDirectory(),
  'dist/server/next-server.js',
);

export async function patchNextNodeServer() {
  logger.info(
    'Adding WebSocket server setup script to NextNodeServer constructor...',
  );

  const source = await readFile(NextServerFilePath, 'utf8');
  if (source.includes('require("next-ws/server")'))
    return logger.warn(
      'WebSocket server setup script already exists, skipping.',
    );

  const tree = parser.parse(source);

  const classDeclaration = tree.program.body.find(
    (n): n is ClassDeclaration =>
      n.type === 'ClassDeclaration' && n.id?.name === 'NextNodeServer',
  );
  if (!classDeclaration) throw 'NextNodeServer class declaration not found.';

  const constructorMethod = classDeclaration.body.body.find(
    (n): n is ClassMethod =>
      n.type === 'ClassMethod' && n.kind === 'constructor',
  );
  if (!constructorMethod) throw 'NextNodeServer constructor method not found.';

  const statement = template.statement
    .ast`require("next-ws/server").setupWebSocketServer(this)`;
  constructorMethod.body.body.push(statement);

  const trueGenerate = Reflect.get(generate, 'default') ?? generate;
  const newSource = trueGenerate(tree).code;

  await writeFile(NextServerFilePath, newSource);
  logger.info('WebSocket server setup script added.');
}

// Add `SOCKET?: Function` to the page module interface check field thing in
// next/dist/build/webpack/plugins/next-types-plugin.js

const NextTypesFilePath = join(
  findNextDirectory(),
  'dist/build/webpack/plugins/next-types-plugin.js',
);

export async function patchNextTypesPlugin() {
  logger.info("Adding 'SOCKET' to the page module interface type...");

  const source = await readFile(NextTypesFilePath, 'utf8');
  if (source.includes('SOCKET?: Function'))
    return logger.warn(
      "'SOCKET' already exists in page module interface, skipping.",
    );

  const toFind = '.map((method)=>`${method}?: Function`).join("\\n  ")';
  const replaceWith = `${toFind} + "; SOCKET?: Function"`;
  const newSource = source.replace(toFind, replaceWith);
  await writeFile(NextTypesFilePath, newSource);
  logger.info("'SOCKET' added to page module interface type.");
}

//

export default Object.assign(
  async () => {
    await patchNextNodeServer();
    await patchNextTypesPlugin();
  },
  {
    date: '2023-06-16' as const,
    supported: '>=13.1.1 <=13.4.8' as const,
  },
);
