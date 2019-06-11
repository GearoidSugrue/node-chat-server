import { Server } from 'http';

const FALLBACK_PORT = 3001;

export function initializeChatServer(server: Server): void {
  const port = process.env.PORT || FALLBACK_PORT;
  server.listen(port, () => console.log(`Chat server started on port ${port}`));
}
