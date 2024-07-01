const { setHttpServer, setWebSocketServer } = require('next-ws/server');
const { Server } = require('node:http');
const { parse } = require('node:url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const httpServer = new Server();
setHttpServer(httpServer);
const webSocketServer = new WebSocketServer({ noServer: true });
setWebSocketServer(webSocketServer);

const app = next({ dev, hostname, port, customServer: httpServer });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  httpServer
    .on('request', async (req, res) => {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    })
    .listen(port, () => {
      console.log(` ▲ Ready on http://${hostname}:${port}`);
    });
});
