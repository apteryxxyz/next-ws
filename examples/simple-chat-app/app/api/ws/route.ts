export function SOCKET(
  client: import('ws').WebSocket,
  _request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
) {
  client.on('message', payload => {
    // Send messages to all connected clients, except the sender
    server.clients.forEach(receiver => {
      if (receiver === client) return;
      receiver.send(payload);
    });
  });
}