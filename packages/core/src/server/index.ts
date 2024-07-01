export * from './setup';
export {
  setHttpServer,
  getHttpServer,
  setWebSocketServer,
  getWebSocketServer,
} from './helpers/persistent';

/**
 * @deprecated
 */
export function verifyPatch() {
  throw new Error(
    "The 'verifyPatch' function has been deprecated in favour of the `npx next-ws-cli@latest verify` command.",
  );
}
