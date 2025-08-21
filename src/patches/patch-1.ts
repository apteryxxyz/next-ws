import $ from 'jscodeshift';
import { definePatch, definePatchStep } from './helpers/define';
import { getDistDirname } from './helpers/next';

/**
 * Add `require('next-ws/server').setupWebSocketServer(this)` to the constructor of
 * `NextNodeServer` in `next/dist/server/next-server.js`.
 * @remark Starting the server and handling connections is part of the core
 */ export const patchNextNodeServer = definePatchStep({
  title: 'Add WebSocket server setup script to NextNodeServer constructor',
  path: 'next:dist/server/next-server.js',
  async transform(code) {
    const PATCH_MARKER = '@patch patchNextNodeServer';
    const patchProgram = $(`
      // ${PATCH_MARKER}
      let nextWs;
      try { nextWs ??= require('next-ws/dist/server/index.cjs') } catch {}
      try { nextWs ??= require('${getDistDirname()}/server/index.cjs') } catch {}
      nextWs?.setupWebSocketServer(this);
    `);
    const patchBlock = //
      $.blockStatement(patchProgram.nodes()[0].program.body);

    return $(code)
      .find($.ClassDeclaration, {
        id: { name: 'NextNodeServer' },
      })
      .find($.MethodDefinition, {
        kind: 'constructor',
        value: { body: { type: 'BlockStatement' } },
      })
      .forEach(({ node: method }) => {
        const bodyStatements = (method.value.body as $.BlockStatement).body;

        const existingPatchPath = $(bodyStatements)
          .find($.Comment as typeof $.CommentLine, {
            value: ` ${PATCH_MARKER}`,
          })
          .paths()[0];
        const existingPatchIndex = bodyStatements.findIndex(
          (s) => s === existingPatchPath?.parent.node,
        );

        if (existingPatchIndex > -1)
          bodyStatements[existingPatchIndex] = patchBlock;
        else bodyStatements.push(patchBlock);
      })
      .toSource();
  },
});

/**
 * Prevent Next.js from immediately closing WebSocket connections on matched routes.
 */
export const patchRouterServer = definePatchStep({
  title: 'Prevent Next.js from immediately closing WebSocket connections',
  path: 'next:dist/server/lib/router-server.js',
  async transform(code) {
    return $(code)
      .find($.ReturnStatement)
      .find($.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'socket' },
          property: { type: 'Identifier', name: 'end' },
        },
      })
      .replaceWith((path) => `null // ${$(path.node).toSource()}`)
      .toSource();
  },
});

export default definePatch({
  name: 'patch-1',
  versions: '>=13.5.1 <=15.5.0',
  steps: [patchNextNodeServer, patchRouterServer],
});
