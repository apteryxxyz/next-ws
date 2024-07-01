'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';

export const WebSocketContext = createContext<WebSocket | null>(null);
WebSocketContext.displayName = 'WebSocketContext';
export const WebSocketConsumer = WebSocketContext.Consumer;

/**
 * Provides a WebSocket client to its children via context,
 * allowing for easy access to the WebSocket from anywhere in the app.
 * @param props WebSocket parameters and children.
 * @returns JSX Element
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
  const client = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const client = new WebSocket(p.url, p.protocols);
    if (p.binaryType) client.binaryType = p.binaryType;
    return client;
  }, [p.url, p.protocols, p.binaryType]);

  useEffect(() => {
    if (client?.readyState !== WebSocket.OPEN) return;
    return () => client.close();
  }, [client]);

  return (
    <WebSocketContext.Provider value={client}>
      {p.children}
    </WebSocketContext.Provider>
  );
}

/**
 * Access the websocket from anywhere in the app, so long as it's wrapped in a WebSocketProvider.
 * @returns WebSocket client when connected, null when disconnected.
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined)
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
}
