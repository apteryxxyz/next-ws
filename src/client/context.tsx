'use client';

// biome-ignore lint/style/useImportType: Actually need the value for JSX
import React, { createContext, useContext, useEffect, useRef } from 'react';

export const WebSocketContext = createContext<WebSocket | null>(null);
WebSocketContext.displayName = 'WebSocketContext';
export const WebSocketConsumer = WebSocketContext.Consumer;

/**
 * Provides a WebSocket client to its children via context,
 * allowing for easy access to the WebSocket from anywhere in the app.
 * @param props WebSocket parameters and children.
 * @returns JSX Element
 * @deprecated `WebSocketProvider` is deprecated, use your own implementation instead.
 */
export function WebSocketProvider(
  p: React.PropsWithChildren<{
    /** The URL for the WebSocket to connect to. */
    url: string;
    /** The subprotocols to use. */
    protocols?: string[] | string;
    /** The binary type to use. */
    binaryType?: BinaryType;
  }>,
) {
  const clientRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (clientRef.current) {
      clientRef.current.close();
      clientRef.current = null;
    }

    const client = new WebSocket(p.url, p.protocols);
    if (p.binaryType) client.binaryType = p.binaryType;
    clientRef.current = client;

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [p.url, p.protocols, p.binaryType]);

  return (
    <WebSocketContext.Provider value={clientRef.current}>
      {p.children}
    </WebSocketContext.Provider>
  );
}

/**
 * Access the websocket from anywhere in the app, so long as it's wrapped in a WebSocketProvider.
 * @returns WebSocket client when connected, null when disconnected.
 * @deprecated `useWebSocket` is deprecated, use your own implementation instead.
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined)
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
}
