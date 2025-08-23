/** @deprecated Prefer UPGRADE and {@link UpgradeHandler} */
export type SocketHandler = (
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
  context: { params: Record<string, string | string[]> },
) => unknown;

export type UpgradeHandler = (
  client: import('ws').WebSocket,
  server: import('ws').WebSocketServer,
  request: import('next/server').NextRequest,
  context: import('./module.js').RouteContext<string>,
) => unknown;
