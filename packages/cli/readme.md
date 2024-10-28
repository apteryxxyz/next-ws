<div align='center'>
  <h1><strong>Next WS</strong></h1>
  <i>Add support for WebSockets in Next.js app directory</i><br>
  <code>npm install next-ws ws</code>
</div>

<div align='center'>
  <img alt='package version' src='https://img.shields.io/npm/v/next-ws?label=version'>
  <img alt='total downloads' src='https://img.shields.io/npm/dt/next-ws'>
  <br>
  <a href='https://github.com/apteryxxyz/next-ws'><img alt='next-ws repo stars' src='https://img.shields.io/github/stars/apteryxxyz/next-ws?style=social'></a>
  <a href='https://github.com/apteryxxyz'><img alt='apteryxxyz followers' src='https://img.shields.io/github/followers/apteryxxyz?style=social'></a>
  <a href='https://discord.gg/B2rEQ9g2vf'><img src='https://discordapp.com/api/guilds/829836158007115806/widget.png?style=shield' alt='discord shield'/></a>
</div>

## 🤔 About

Next WS (`next-ws`) is an advanced Next.js plugin that seamlessly integrates WebSocket server capabilities directly into routes located in the **app directory**. With Next WS, you no longer require a separate server for WebSocket functionality.

> [!IMPORTANT]  
> Next WS is designed for use in server-based environments. It is not suitable for serverless platforms like Vercel, where WebSocket servers are not supported. Furthermore, this plugin is built for the app directory and does not support the older pages directory.

This module is inspired by the now outdated `next-plugin-websocket`, if you are using an older version of Next.js, that module may work for you.

## 🏓 Table of Contents

- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [🌀 Examples](#-examples)
  - [Creating a Socket](#creating-a-socket)
  - [Using a Custom Server](#using-a-custom-server)
  - [Accessing the WebSocket Server](#accessing-the-websocket-server)
  - [Client-Side Utilities](#client-side-utilities)

## 📦 Installation

Setting up a WebSocket server with Next WS involves patching your local Next.js installation. Next WS simplifies this process with a CLI command that automatically detects and patches your Next.js version, ensuring compatibility. Note that Next.js version 13.1.1 or higher is required.

```sh
npx next-ws-cli@latest patch
```

> [!NOTE]  
> If at any point your local Next.js installation is changed or updated you will need to re-run the patch command.

After successfully patching Next.js, install the Next WS package along with its peer dependency, ws, into your project:

```sh
npm install next-ws ws
```

## 🚀 Usage

Using WebSocket functionality in your Next.js application with Next WS is simple and requires no additional configuration. Simply export a `SOCKET` function from any route file. This function will be invoked whenever a client establishes a WebSocket connection to that specific route.

The `SOCKET` function receives three arguments: the WebSocket client instance, the incoming HTTP request - which you can use to get the URL path, query parameters, and headers - and the WebSocket server instance.

```ts
export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer
) {
  // ...
}
```

### With a Custom Server

In production, Next.js uses a worker process for routes, which can make it difficult to access the WebSocket server from outside a `SOCKET` handler, especially when the WebSocket server exists on the main process. For those needing to overcome this challenge or preferring a custom server setup, Next WS provides a solution.

The `next-ws/server` module offers functions for setting the HTTP and WebSocket servers. You use these functions to tell Next WS to use your server instances instead of creating its own. This allows you to then access the instances you created yourself from anywhere in your app. Refer to the [example below](#using-a-custom-server).

## 🌀 Examples

For more detailed examples, refer the [`examples` directory](https://github.com/apteryxxyz/next-ws/tree/main/examples).

### Creating a Socket

Creating an API route anywhere within the app directory and exporting a `SOCKET` function from it is all that is required. Below is an example of a simple echo server, which sends back any message it receives.

```ts
// app/api/ws/route.ts (can be any route file in the app directory)

export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer
) {
  console.log('A client connected');

  client.on('message', (message) => {
    console.log('Received message:', message);
    client.send(message);
  });

  client.on('close', () => {
    console.log('A client disconnected');
  });
}
```

### Using a Custom Server

> [!IMPORTANT]  
> Next WS was made to avoid the need for a custom server, if you are using one, you don't need this package and can just use a websocket server directly.

To use a custom server, all you need to do is tell Next WS to use your server instead of creating its own. This can be done by calling the `setHttpServer` and `setWebSocketServer` functions from `next-ws/server` and passing your server instances.

```ts
// server.js

const { setHttpServer, setWebSocketServer } = require('next-ws/server');
const { Server } = require('node:http');
const { parse } = require('node:url');
const next = require('next');
const { WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const httpServer = new Server();
const webSocketServer = new WebSocketServer({ noServer: true });
// Tell Next WS about the HTTP and WebSocket servers before starting the custom server
setHttpServer(httpServer);
setWebSocketServer(webSocketServer);

const app = next({ dev, hostname, port, customServer: true });
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
```

### Accessing the WebSocket Server

Along with setters, Next WS also provides getters for the HTTP and WebSocket servers. These functions can be used to access the servers from anywhere in your app.

> [!IMPORTANT]  
> In order to use the `getWebSocketServer` and `getHttpServer` functions, you must be using a [custom server](https://nextjs.org/docs/advanced-features/custom-server), this is due to a limitation in Next.js. Refer to the [With a Custom Server](#with-a-custom-server).

```ts
// app/api/stats/route.ts

import { getWebSocketServer } from 'next-ws/server';
// There is also a `getHttpServer` function available

export function GET() {
  const wsServer = getWebSocketServer();
  // Response with the number of connected clients
  return Response.json({ count: wsServer.clients.size });
}
```

### Client-Side Utilities

To make it easier to connect to your new WebSocket server, Next WS also provides some client-side utilities. These are completely optional, you can use your own implementation if you wish.

```tsx
// layout.tsx
'use client';

import { WebSocketProvider } from 'next-ws/client';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <html>
      <body>
        <WebSocketProvider url='ws://localhost:3000/api/ws'>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
```

The following is the props interface for the `WebSocketProvider` component, containing all the available options.

```ts
interface WebSocketProviderProps {
  children: React.ReactNode;

  /** The URL for the WebSocket to connect to. */
  url: string;
  /** The subprotocols to use. */
  protocols?: string[] | string;
  /** The binary type to use. */
  binaryType?: BinaryType;
}
```

Now you can use the `useWebSocket` hook to get the WebSocket instance, and send and receive messages.

```tsx
// page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from 'next-ws/client';

export default function Page() {
  const ws = useWebSocket();
  //    ^? WebSocket on the client, null on the server

  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      const payload =
        typeof event.data === 'string' ? event.data : await event.data.text();
      const message = JSON.parse(payload) as Message;
      setMessages((p) => [...p, message]);
    }

    ws?.addEventListener('message', onMessage);
    return () => ws?.removeEventListener('message', onMessage);
  }, [ws]);

  return (
    <>
      <input ref={inputRef} type='text' />

      <button onClick={() => ws?.send(inputRef.current?.value ?? '')}>
        Send message to server
      </button>

      <p>
        {message === null
          ? 'Waiting to receive message...'
          : `Got message: ${message}`}
      </p>
    </>
  );
}
```
