import { createContext, useContext, useEffect, useMemo } from 'react';

export const WebSocketContext = createContext<WebSocket | null>(null);
WebSocketContext.displayName = 'WebSocketContext';

export interface WebSocketProviderProps {
  children: React.ReactNode;

  /** The URL for the WebSocket to connect to. */
  url: string;
  /** The subprotocols to use. */
  protocols?: string[] | string;
  /** The binary type to use. */
  binaryType?: BinaryType;
}

/**
 * Provides a WebSocket instance to its children via context,
 * allowing for easy access to the WebSocket from anywhere in the app.
 * @param props WebSocket parameters and children.
 * @returns JSX Element
 */
export function WebSocketProvider({
  children,
  url,
  protocols,
  binaryType,
}: WebSocketProviderProps) {
  const isBrowser = typeof window !== 'undefined';
  const instance = useMemo(() => {
    if (!isBrowser) return null;
    const client = new WebSocket(url, protocols);
    if (binaryType) client.binaryType = binaryType;
    return client;
  }, [isBrowser, url, protocols]);

  useEffect(() => {
    return () => instance?.close();
  }, []);

  return <WebSocketContext.Provider value={instance}>
    {children}
  </WebSocketContext.Provider>;
}

export const WebSocketConsumer = WebSocketContext.Consumer;

/**
 * Access the websocket from anywhere in the app, so long as it's wrapped in a WebSocketProvider.
 * @returns WebSocket instance when connected, null when disconnected.
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined)
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
}
