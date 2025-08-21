export type SocketHandler = (
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
  context: { params: Record<string, string | string[]> },
) => unknown;

export type NextSocketHandler = (
  client: import('ws').WebSocket,
  server: import('ws').WebSocketServer,
  // With the new handler signature, a reference to message is lost
  // IDEA: If anyone needs it, perhaps we can add it back via Object.assign
  // Same could be done for the WebSocket client, we'll see
  request: import('next/server').NextRequest,
  context: import('./module').RouteContext<string>,
) => unknown;
