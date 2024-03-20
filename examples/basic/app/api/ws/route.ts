export function SOCKET(
  client: import('ws').WebSocket,
  _request: import('http').IncomingMessage,
  _server: import('ws').WebSocketServer,
) {
  console.log('A client connected!');

  client.on('message', message => {
    client.send(message);
  });
  
  client.on('close', () => {
    console.log('A client disconnected!');
  });
}