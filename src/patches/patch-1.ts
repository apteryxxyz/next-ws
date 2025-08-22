import $ from 'jscodeshift';
import { definePatch, definePatchStep } from './helpers/define';
const CommentLine = $.Comment as typeof $.CommentLine;

/**
 * Add `require('next-ws/server').attachWebSocketUpgradeHandler({ nextServer: this })`
 * to the constructor of `NextNodeServer`.
 * @remark Starting the server and handling connections is part of core.
 */
export const injectWebSocketSetup = definePatchStep({
  title: 'Add WebSocket server attach script to NextNodeServer constructor',
  path: 'next:dist/server/next-server.js',
  async transform(code) {
    const marker = '@patch attach-websocket-server';
    const snippet = $(`
      // ${marker}
      let nextWs;
      try { nextWs ??= require('next-ws/server') } catch { }
      try { nextWs ??= require(require.resolve('next-ws/server', { paths: [process.cwd()] })) } catch { }
      nextWs?.attachWebSocketUpgradeHandler({ nextServer: this });
    `);
    const block = $.blockStatement(snippet.nodes()[0].program.body);

    return $(code)
      .find($.ClassDeclaration, { id: { name: 'NextNodeServer' } })
      .find($.MethodDefinition, { kind: 'constructor' })
      .forEach(({ node }) => {
        const body = (node.value.body as $.BlockStatement).body;

        const existing = $(body)
          .find(CommentLine, { value: ` ${marker}` })
          .paths()[0];
        const idx = body.findIndex((s) => s === existing?.parent.node);

        if (existing && idx > -1) {
          body[idx] = block;
        } else {
          body.push(block);
        }
      })
      .toSource();
  },
});

/**
 * Prevent Next.js from immediately closing WebSocket connections on
 * matched routes.
 */
export const disableSocketAutoClose = definePatchStep({
  title: 'Prevent WebSocket connections from being closed automatically',
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
      .replaceWith((path) => {
        const expr = $.unaryExpression('void', $.literal(0)); // void 0
        expr.comments = [$.commentLine(` ${$(path.node).toSource()}`)];
        return expr;
      })
      .toSource();
  },
});

/**
 * Ensure AsyncLocalStorage is available in the global scope.
 * @remark For whatever reason, when using a custom server, the
 *   AsyncLocalStorage is not available in the global scope. This
 *   patch ensures it is.
 */
export const ensureGlobalAsyncLocalStorage = definePatchStep({
  title: 'Ensure AsyncLocalStorage is available in the global scope',
  path: 'next:dist/server/app-render/async-local-storage.js',
  async transform(code) {
    const marker = '@patch async-local-storage';
    const snippet = $(`
      // ${marker}
      try {
        globalThis.AsyncLocalStorage
          ??= require('node:async_hooks').AsyncLocalStorage;
      } catch {}
    `);
    const block = $.blockStatement(snippet.nodes()[0].program.body);

    return $(code)
      .find($.Program)
      .forEach(({ node }) => {
        const body = node.body;

        const existing = $(body)
          .find(CommentLine, { value: ` ${marker}` })
          .paths()[0];
        let idx = body.findIndex((s) => s === existing?.parent.node);

        if (idx > -1) {
          body[idx] = block;
        } else {
          while (idx < 0 || !body[idx] || 'directive' in body[idx]!) idx++;
          body.splice(idx, 0, block);
        }
      })
      .toSource();
  },
});

export default definePatch({
  name: 'patch-1',
  versions: '>=13.5.1 <=15.5.0',
  steps: [
    injectWebSocketSetup,
    disableSocketAutoClose,
    ensureGlobalAsyncLocalStorage,
  ],
});
