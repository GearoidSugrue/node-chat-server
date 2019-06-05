import { Server } from 'http';

export class ChatServer {
  public static readonly PORT = 3001;
  private readonly port: string | number;

  constructor(private server: Server) {
    this.port = process.env.PORT || ChatServer.PORT;
  }

  public startListening(): void {
    this.server.listen(this.port, () =>
      console.log(`Chat server started on port ${this.port}`)
    );
  }
}
