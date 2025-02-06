import { createPatch, createPatchStep } from '~/patches/helpers/patch';
import { getDistDirname } from './helpers/next';

/**
 * Add `require('next-ws/server').setupWebSocketServer(this)` to the constructor of
 * `NextNodeServer` in `next/dist/server/next-server.js`.
 * @remark Starting the server and handling connections is part of the core
 */
export const patchNextNodeServer = createPatchStep({
  title: 'Add WebSocket server setup script to NextNodeServer constructor.',
  path: 'next:dist/server/next-server.js',
  ignoreIf: 'setupWebSocketServer(this)',
  modify(source) {
    const sourceLines = source.split('\n');

    let inConstructor = false;
    let constructorEndIndex = -1;
    let braceCount = 0;

    for (let i = 0; i < sourceLines.length; i++) {
      const line = sourceLines[i] ?? '';

      if (!inConstructor && line.includes('constructor(')) {
        inConstructor = true;
        braceCount = 0;
      }

      if (inConstructor) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        if (braceCount === 0) {
          constructorEndIndex = i;
          break;
        }
      }
    }

    if (constructorEndIndex === -1)
      throw new Error('Could not find constructor end index.');

    // Package manager weirdness,
    const setupScript = `
;{
  let nextWs;
  try { nextWs = require('next-ws/server') } catch {
  try { nextWs = require('${getDistDirname()}/server/index.cjs') } catch {
  /* don't let this crash apps that don't use next-ws */ }}
  nextWs?.setupWebSocketServer(this);
};
    `;
    sourceLines.splice(constructorEndIndex, 0, setupScript);
    const newSource = sourceLines.join('\n');
    return newSource;
  },
});

/**
 * Add `SOCKET?: Function` to the page module interface check field thing in
 * `next/dist/build/webpack/plugins/next-types-plugin.js`.
 */
export const patchNextTypesPlugin = createPatchStep({
  title: 'Add SOCKET type to Next types',
  path: 'next:dist/build/webpack/plugins/next-types-plugin.js',
  ignoreIf: 'SOCKET?: Function;',
  modify(source) {
    const mapRegex =
      /\.map\(\(method\)=>`\${method}\?: Function`\).join\(['"]\\n +['"]\)/g;
    const newSource = source.replace(mapRegex, (match) => {
      return `${match} + "; SOCKET?: Function;"`;
    });
    return newSource;
  },
});

export default createPatch({
  name: 'patch-1',
  versions: '>=13.2.0 <=13.4.8',
  steps: [patchNextNodeServer, patchNextTypesPlugin],
});
