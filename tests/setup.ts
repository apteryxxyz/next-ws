import { spawn } from 'node:child_process';

export function prepareDevServer(appDir: string) {
  let serverProcess: ReturnType<typeof spawn> | null = null;
  let serverUrl: string | null = null;

  return {
    async startServer() {
      if (serverProcess) return serverUrl!;

      const port = await getAvailablePort();
      serverUrl = `http://localhost:${port}`;

      serverProcess = spawn('pnpm', ['next', 'dev', '-p', port.toString()], {
        cwd: `examples/${appDir}`,
        shell: true,
      });

      await waitForServerToStart(serverUrl);
      return serverUrl;
    },
    async stopServer() {
      if (!serverProcess) return;

      serverProcess.kill('SIGTERM');
      if (!serverProcess.killed)
        await new Promise((r) => serverProcess!.once('exit', r));

      serverProcess = null;
      serverUrl = null;
    },
  };
}

async function getAvailablePort() {
  const net = await import('node:net');
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function waitForServerToStart(url: string, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`Server did not start within ${timeout}ms.`);
}
