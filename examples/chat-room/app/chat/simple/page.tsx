'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '../_shared/message';
import { MessageList } from '../_shared/message-list';
import { MessageSubmit } from '../_shared/message-submit';

export default function Page() {
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = `ws://${window.location.host}/chat/simple/socket`;
    socketRef.current = new WebSocket(url);
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const onMessage = useCallback((message: Message) => {
    socketRef.current?.send(JSON.stringify(message));
    setMessages((messages) => [...messages, { ...message, author: 'You' }]);
  }, []);

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      const payload =
        typeof event.data === 'string' ? event.data : await event.data.text();
      const message = JSON.parse(payload) as Message;
      setMessages((p) => [...p, message]);
    }

    socketRef.current?.addEventListener('message', handleMessage);
    return () =>
      socketRef.current?.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ maxWidth: '50vh' }}>
      <MessageList messages={messages} />
      <MessageSubmit onMessage={onMessage} />
    </div>
  );
}
