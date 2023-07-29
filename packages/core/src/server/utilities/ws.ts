import { WebSocketServer } from 'ws';

/**
 * Get the WebSocketServer instance.
 * @returns The WebSocketServer instance.
 */
// prettier-ignore
export function getWsServer() {
    return new WebSocketServer({ noServer: true });
}
