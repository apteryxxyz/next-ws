/** A function that handles a WebSocket connection. */
export type SocketHandler = (
  /** The WebSocket client that connected. */
  client: import('ws').WebSocket,
  /** The HTTP request that initiated the WebSocket connection. */
  request: import('http').IncomingMessage,
  /** The WebSocket server. */
  server: import('ws').WebSocketServer,
  context: {
    /** The route parameters. */
    params: Record<string, string | string[]>;
  },
) => Awaitable<OnClose | unknown>;

type OnClose = () => Awaitable<unknown>;
type Awaitable<T> = T | Promise<T>;
