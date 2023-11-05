import { Server } from 'node:http';
import * as Log from 'next/dist/build/output/log';
import NextNodeServer from 'next/dist/server/next-server';
import { WebSocketServer } from 'ws';

// =============== HTTP Server ===============

export const CustomHttpServer = Symbol('NextWS::CustomHttpServer');

/**
 * Get the HTTP Server instance from the NextNodeServer.
 * @param nextServer The NextNodeServer instance.
 * @returns The HTTP Server instance.
 */
export function useHttpServer(nextServer: NextNodeServer) {
  // NextNodeServer is always required, so check for it before attempting to use custom server
  if (!nextServer || !(nextServer instanceof NextNodeServer)) {
    Log.error('[next-ws] could not find the NextNodeServer instance');
    process.exit(1);
  }

  const existing = Reflect.get(globalThis, CustomHttpServer) as Server;
  if (existing) {
    Log.warnOnce(
      '[next-ws] is using a custom HTTP Server, this is experimental and may not work as expected'
    );
    return existing;
  }

  // @ts-expect-error - serverOptions is protected
  const httpServer = nextServer.serverOptions?.httpServer;
  if (!httpServer || !(httpServer instanceof Server)) {
    Log.error('[next-ws] could not find the HTTP Server instance');
    process.exit(1);
  }

  return httpServer;
}

// =============== WebSocket Server ===============

export const CustomWsServer = Symbol('NextWS::CustomWsServer');

/**
 * Create a WebSocketServer.
 * @returns The WebSocketServer instance.
 */
export function useWsServer() {
  const existing = Reflect.get(globalThis, CustomWsServer) as WebSocketServer;
  if (existing) {
    Log.warnOnce(
      '[next-ws] is using a custom WebSocketServer, this is experimental and may not work as expected'
    );
    return existing;
  }

  return new WebSocketServer({ noServer: true });
}

/** A function that handles a WebSocket connection. */
export type SocketHandler = (
  /** The WebSocket client that connected. */
  client: import('ws').WebSocket,
  /** The HTTP request that initiated the WebSocket connection. */
  request: import('http').IncomingMessage,
  /** The WebSocket server. */
  server: import('ws').WebSocketServer
) => unknown;

declare global {
  export namespace NodeJS {
    interface Global {
      [CustomHttpServer]: import('node:http').Server;
      [CustomWsServer]: import('ws').WebSocketServer;
    }
  }
}
