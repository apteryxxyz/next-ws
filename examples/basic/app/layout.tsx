'use client';

import { WebSocketProvider } from 'next-ws/client';

export default function Layout(p: React.PropsWithChildren) {
  return <html>
    <body>
      <WebSocketProvider
        url="ws://localhost:3000/api/ws"
      >
        {p.children}
      </WebSocketProvider>
    </body>
  </html>;
}