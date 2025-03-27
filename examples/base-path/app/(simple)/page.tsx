'use client';

import { MessageList, MessageSubmit, useMessaging } from 'shared/chat-room';

export default function Page() {
  const [messages, sendMessage] = useMessaging(
    () => `ws://${window.location.host}/some-base-path/api/ws`,
  );

  return (
    <div style={{ maxWidth: '50vh' }}>
      <MessageList messages={messages} />
      <MessageSubmit onMessage={sendMessage} />
    </div>
  );
}
