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
