export interface Adapter {
  broadcast(room: string, message: unknown): Promise<void>;
  onMessage(room: string, handler: (message: unknown) => void): void;
  close(): Promise<void>;
}
