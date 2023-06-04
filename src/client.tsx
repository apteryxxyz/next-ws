import { createContext, useContext, useEffect, useMemo } from 'react';

const WebSocketContext = createContext<WebSocket | null>(null);
WebSocketContext.displayName = 'WebSocketContext';

/**
 * Provides a WebSocket instance to its children via context,
 * allowing for easy access to the websocket from anywhere in the app
 * @param props WebSocket parameters and children
 * @returns JSX Element
 */
function WebSocketProvider({
    children,
    url,
    protocols,
}: {
    children: React.ReactNode;
    url: string;
    protocols?: string[] | string;
}) {
    const isBrowser = typeof window !== 'undefined';
    const ws = useMemo(
        () => (isBrowser ? new WebSocket(url, protocols) : null),
        [isBrowser, url, protocols]
    );

    useEffect(() => {
        return () => {
            if (ws && ws.readyState !== WebSocket.CLOSED) ws.close();
        };
    }, []);

    return <WebSocketContext.Provider value={ws}>
        {children}
    </WebSocketContext.Provider>;
}

const WebSocketConsumer = WebSocketContext.Consumer;

/**
 * Access the websocket from anywhere in the app, so long as it's wrapped in a WebSocketProvider
 * @returns WebSocket on the client, null on the server
 */
function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined)
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    return context;
}

export { WebSocketContext, WebSocketProvider, WebSocketConsumer, useWebSocket };
