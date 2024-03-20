<div align="center">
  <h1><strong>Next WS</strong></h1>
  <i>Add support for WebSockets in Next.js app directory</i><br>
  <code>npm install next-ws ws</code>
</div>

<div align="center">
  <img alt="package version" src="https://img.shields.io/npm/v/next-ws?label=version">
  <img alt="total downloads" src="https://img.shields.io/npm/dt/next-ws">
  <br>
  <a href="https://github.com/apteryxxyz/next-ws"><img alt="next-ws repo stars" src="https://img.shields.io/github/stars/apteryxxyz/next-ws?style=social"></a>
  <a href="https://github.com/apteryxxyz"><img alt="apteryxxyz followers" src="https://img.shields.io/github/followers/apteryxxyz?style=social"></a>
  <a href="https://discord.gg/vZQbMhwsKY"><img src="https://discordapp.com/api/guilds/829836158007115806/widget.png?style=shield" alt="discord shield"/></a>
</div>

---

## 🤔 About

Next WS (`next-ws`) is an advanced Next.js plugin designed to seamlessly integrate WebSocket server functionality into API routes within the **app directory**. With Next WS, you no longer require a separate server for WebSocket functionality.

It's **important** to note that this module can only be used when working with a server. Unfortunately, in serverless environments like Vercel, WebSocket servers cannot be used. Additionally, this module was built for the app directory and is incompatible with the older pages directory.

This module is inspired by the now outdated `next-plugin-websocket`, if you are using an older version of Next.js, that module may work for you.

---

## 🏓 Table of Contents

- [🤔 About](#-about)
- [🏓 Table of Contents](#-table-of-contents)
- [📦 Installation](#-installation)
  - [Automated Patching](#automated-patching)
- [🚀 Usage](#-usage)
  - [🚓 Verify Patch](#-verify-patch)
- [🌀 Example](#-example)
  - [📁 Server](#-server)
  - [📁 Client](#-client)

---

## 📦 Installation

In order to setup a WebSocket server, Next WS needs to patch your local Next.js installation. Next WS provides a CLI command to do this for you, it will automatically detect your Next.js version and patch it accordingly, however a minimum version of Next.js 13.1.1 is required.

```sh
npx next-ws-cli@latest patch
```

> If at any point your local Next.js installation is changed or updated you will need to re-run the patch command.

Once the patch is complete, you will need to install the Next WS package into your project.

```sh
npm install next-ws ws
# ws is a peer dependency, you must install it as well
```

### Automated Patching

If you would like to automate the patching process, you can add the following script to your `package.json` file.

```json
{
  "scripts": {
    "postinstall": "FORCE_NEXT_WS_PATCH=true npx next-ws-cli@latest patch"
  }
}
```

### 🚓 Verify Patch (Optional)

It is recommended to add the following code to the top level of your `next.config.mjs`.

This will verify that Next WS has been patched correctly, and throw an error if it has not. Preventing you from accidentally deploying a broken setup.

```ts
import { verifyPatch } from 'next-ws/server';
verifyPatch();
```

---

## 🚀 Usage

Using Next WS is a breeze, requiring zero configuration. Simply export a `SOCKET` function from any API route. This function gets called whenever a client connects to the WebSocket server at the respective API path.

The `SOCKET` function receives three arguments: the WebSocket client, the HTTP request - which you can use to get the URL path, query parameters, and headers - and the WebSocket server that `next-ws` created.

```ts
export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
) {
  // ...
}
```

With this straightforward setup, you can fully leverage the capabilities of Next WS and efficiently handle WebSocket connections within your Next.js application.

---

## 🌀 Example

### 📁 Server

Create an API route anywhere within the app directory, and export a `SOCKET` function from it, below is an example of a simple echo server, which sends back any message it receives.

```ts
// app/api/ws/route.ts (can be any route file in the app directory)
export function SOCKET(
  client: import('ws').WebSocket,
  request: import('http').IncomingMessage,
  server: import('ws').WebSocketServer,
) {
  console.log('A client connected!');

  client.on('message', message => {
    client.send(message);
  });
  
  client.on('close', () => {
    console.log('A client disconnected!');
  });
}
```

You are pretty much done at this point, you can now connect to the WebSocket server using the native WebSocket API in the browser.

### 📁 Client

To make it easier to connect to your new WebSocket server, Next WS also provides some client-side utilities. These are completely optional, you can use your own implementation if you wish.

```tsx
// layout.tsx
'use client';

import { WebSocketProvider } from 'next-ws/client';

export default function Layout({ children }: React.PropsWithChildren) {
  return <html>
    <body>
      <WebSocketProvider
        url="ws://localhost:3000/api/ws"
      >
        {children}
      </WebSocketProvider>
    </body>
  </html>;
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

  const onMessage = useCallback(
    (event: MessageEvent<Blob>) =>
      void event.data.text().then(setMessage),
    [],
  );

  useEffect(() => {
    ws?.addEventListener('message', onMessage);
    return () => ws?.removeEventListener('message', onMessage);
  }, [onMessage, ws]);

  return <>
    <input
      ref={inputRef}
      type="text"
    />

    <button
      onClick={() => ws?.send(inputRef.current?.value ?? '')}
    >
      Send message to server
    </button>

    <p>
      {message === null
        ? 'Waiting to receive message...'
        : `Got message: ${message}`}
    </p>
  </>;
}
```
