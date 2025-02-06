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

`next-ws` is a simple package that adds WebSocket support to your Next.js app directory. With `next-ws`, you no longer need to create a separate WebSocket server to handle WebSocket connections. Instead, you can handle WebSocket connections directly in your Next.js API routes.

> [!IMPORTANT]  
> Next WS is designed for use in server-based environments. It is not suitable for serverless platforms like Vercel, where WebSocket servers are not supported. Furthermore, this plugin is built for the app directory and does not support the older pages directory.

This module is inspired by the now outdated `next-plugin-websocket`, if you are using an older version of Next.js, that module may work for you.

## 🏓 Table of Contents

- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [🌀 Examples](#-examples)

## 📦 Installation

To set up a WebSocket server with `next-ws`, you need to patch your local Next.js installation. `next-ws` simplifies this process by providing a CLI command that handles the patching for you. Follow these steps to get started:

1. **Install Dependencies**: Use your preferred package manager to install `next-ws` and its peer dependency `ws`:

   ```bash
   npm install next-ws ws
   pnpm add next-ws ws
   yarn add next-ws ws
   ```

2. **Add Prepare Script**: Add the following `prepare` script to your `package.json`. The `prepare` script is a lifecycle script that runs automatically when you run `npm install`, ensuring that your Next.js installation is patched with `next-ws` every time you install it:

   ```json
   {
     "scripts": {
       "prepare": "next-ws patch"
     }
   }
   ```

## 🚀 Usage

Using WebSocket connections in your Next.js app directory is simple with `next-ws`. You can handle WebSocket connections directly in your API routes via exported `SOCKET` functions. Here's an example of a simple WebSocket echo server:

```js
export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
  context: { params: Record<string, string | string[]> },
) {
  // ...
}
```

## 🌀 Examples

> [!TIP]
> For more detailed examples, refer the [`examples` directory](https://github.com/apteryxxyz/next-ws/tree/main/examples).

### Echo Server

This example demonstrates a simple WebSocket echo server that sends back any message it receives. Create a new API route file anywhere in your app directory and export a `SOCKET` function to handle WebSocket connections:

```ts
// app/api/ws/route.ts (can be any route file in the app directory)

export function SOCKET(
  client: import("ws").WebSocket,
  request: import("http").IncomingMessage,
  server: import("ws").WebSocketServer
) {
  console.log("A client connected");

  client.on("message", (message) => {
    console.log("Received message:", message);
    client.send(message);
  });

  client.on("close", () => {
    console.log("A client disconnected");
  });
}
```

You can now connect to your WebSocket server, send it a message and receive the same message back.

### Chat Room

See the [chat room example](https://github.com/apteryxxyz/next-ws/tree/main/examples/chat-room)
