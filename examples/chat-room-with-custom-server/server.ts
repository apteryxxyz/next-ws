import { Server } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { setHttpServer, setWebSocketServer } from 'next-ws/server';
import { WebSocketServer } from 'ws';

const httpServer = new Server();
setHttpServer(httpServer);
const webSocketServer = new WebSocketServer({ noServer: true });
setWebSocketServer(webSocketServer);

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port, customServer: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  httpServer
    .on('request', async (req, res) => {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    })
    .listen(port, () => {
      console.log(` ▲ Ready on http://${hostname}:${port}`);
    });
});
