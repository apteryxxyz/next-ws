import type { IncomingMessage } from 'node:http';
import { NextRequest } from 'next/server';

export function toNextRequest(message: IncomingMessage) {
  const controller = new AbortController();
  const headers = new Headers(message.headers as never);
  const protocol = 'encrypted' in message.socket ? 'https' : 'http';
  const url = `${protocol}://${headers.get('host')}${message.url}`;

  message.once('aborted', () => controller.abort());

  return new NextRequest(url, {
    method: message.method,
    headers: headers,
    body:
      message.method === 'GET' || message.method === 'HEAD'
        ? undefined
        : (message as unknown as ReadableStream<Uint8Array>),
    signal: controller.signal,
    referrer: headers.get('referer') || undefined,
  });
}
