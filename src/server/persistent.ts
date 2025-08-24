function useGlobal<T>(key: PropertyKey) {
  return [
    function get() {
      return Reflect.get(globalThis, key) as T | undefined;
    },
    function set(value: T) {
      return Reflect.set(globalThis, key, value);
    },
    function use(getter: () => T) {
      const existing = Reflect.get(globalThis, key);
      if (existing) return existing as T;
      Reflect.set(globalThis, key, getter());
      return getter() as T;
    },
  ] as const;
}

// ===== HTTP Server ===== //

export const [getHttpServer, setHttpServer, useHttpServer] = //
  useGlobal<import('node:http').Server>(
    Symbol.for('next-ws.http-server'), //
  );

// ===== WebSocket Server ===== //

export const [getWebSocketServer, setWebSocketServer, useWebSocketServer] =
  useGlobal<import('ws').WebSocketServer>(
    Symbol.for('next-ws.websocket-server'),
  );
