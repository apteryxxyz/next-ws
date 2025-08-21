import { headers } from 'next/headers';

export function GET() {
  const headers = new Headers();
  headers.set('Connection', 'Upgrade');
  headers.set('Upgrade', 'websocket');
  return new Response('Upgrade Required', { status: 426, headers });
}

export const experimental_socketAsyncContext = true;

export async function SOCKET(
  client: import('ws').WebSocket,
  server: import('ws').WebSocketServer,
  _request: import('next/server').NextRequest,
  _context: import('next-ws/server').RouteContext<'/api/ws'>,
) {
  // For test purposes
  await headers();

  for (const other of server.clients) {
    if (client === other || other.readyState !== other.OPEN) continue;
    other.send(
      JSON.stringify({
        author: 'System',
        content: 'A new user joined the chat',
      }),
    );
  }

  client.on('message', (message) => {
    // Forward the message to all other clients
    for (const other of server.clients)
      if (client !== other && other.readyState === other.OPEN)
        other.send(message);
  });

  client.send(
    JSON.stringify({
      author: 'System',
      content: `Welcome to the chat! There ${server.clients.size - 1 === 1 ? 'is 1 other user' : `are ${server.clients.size - 1 || 'no'} other users`} online`,
    }),
  );

  return () => {
    for (const other of server.clients) {
      if (client === other || other.readyState !== other.OPEN) continue;
      other.send(
        JSON.stringify({
          author: 'System',
          content: 'A user left the chat',
        }),
      );
    }
  };
}
