'use client';

import { MessageList } from '../_shared/message-list';
import { MessageSubmit } from '../_shared/message-submit';
import { useMessaging } from '../_shared/websocket';

export default function Page() {
  const [messages, sendMessage] = useMessaging(
    () => `ws://${window.location.host}/chat/simple/socket`,
  );

  return (
    <div style={{ maxWidth: '50vh' }}>
      <MessageList messages={messages} />
      <MessageSubmit onMessage={sendMessage} />
    </div>
  );
}
