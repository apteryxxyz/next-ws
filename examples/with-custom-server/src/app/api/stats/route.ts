// NOTE: Because we are using a custom server, this is possible

import { getWebSocketServer } from 'next-ws/server';

export function GET() {
  const wsServer = getWebSocketServer();
  return Response.json({ count: wsServer.clients.size });
}
