<div align="center">
    <h1><strong>Next WS</strong></h1>
    <i>Add support for WebSockets in Next.js 13 app directory</i><br>
    <code>npm install next-ws</code>
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

Next WS (`next-ws`) is an advanced Next.js **13** plugin designed to seamlessly integrate WebSocket server functionality into API routes within the **app directory**. With Next WS, you no longer require a separate server for WebSocket functionality.

It's important to note that this module can only be used when working with a server. Unfortunately, in serverless environments like Vercel, WebSocket servers cannot be used.  Additionally, this module was built for the app directory and is incompatible with the older pages directory.

This module is inspired by the now outdated `next-plugin-websocket`, if you are using an older version of Next.js, that module may work for you.

---

## 🏓 Table of Contents

- [🤔 About](#-about)
- [🏓 Table of Contents](#-table-of-contents)
- [📦 Installation](#-installation)
- [🚀 Usage](#-api)
- [🌀 Example](#-example)
  - [📁 Server](#-server)
  - [📁 Client](#-client)
  
---

## 📦 Installation

```sh
npm install next-ws
yarn add next-ws
pnpm add next-ws
```

Upon installation, Next WS will automatically patch your existing Next.js installation to add support for WebSockets in API routes in the app directory. 

<details>
    <summary><strong>Caveats</strong></summary>

As this module modifies the Next.js installation, if for any reason it changes (such as when you update Next.js), you will need to reinstall Next WS. And if you want to uninstall Next WS, you will need to reinstall Next.js.
</details>

---

## 🚀 Usage

Using Next WS is a breeze, requiring zero configuration. Simply export a `SOCKET` function from an API route. This function gets called whenever a client connects to the WebSocket server at the respective API path.

The `SOCKET` function receives two arguments: the WebSocket client and the HTTP request, which you can use to get the URL path, query parameters, and headers.

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

---

### 📁 Client

To make it easier to connect to your new WebSocker server, Next WS also provides some client-side utilities. These are not required, you can use the native WebSocket API if you prefer.

```tsx
// layout.tsx
'use client';

import { WebSocketProvider } from 'next-ws/client';

export default function Layout() {
    return <WebSocketProvider url="ws://localhost:3000/api/ws">
        {...}
    </WebSocketProvider>;
}
```

```tsx
// page.tsx
'use client';

import { useWebSocket } from 'next-ws/client';
import { useCallback, useEffect, useState } from 'react';

export default function Page() {
    const ws = useWebSocket();
    //    ^? WebSocket on the client, null on the server

    const [value, setValue] = useState('');
    const [message, setMessage] = useState<string | null>('');

    const onMessage = useCallback((event: MessageEvent) => {
        const text = await event.data.text();
        setMessage(text);
    }, []);

    useEffect(() => {
        ws?.addEventListener('message', onMessage);
        return () => ws?.removeEventListener('message', onMessage);
    }, []);

    return <>
        <input
            type="text"
            value={value}
            onChange={event => setValue(event.target.value)}
        />

        <button onClick={() => ws.send(value)}>
            Send message to server
        </button>

        <p>
            {message === null
                ? 'Waiting for server to send a message...'
                : `Got message: ${message}`}
        </p>
    </>
}
```
