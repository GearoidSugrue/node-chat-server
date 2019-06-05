import { Server } from 'http';
import socket, { Socket } from 'socket.io';

import { ChatroomsStore } from '../data-store/chatroom-store';
import { UsersStore } from '../data-store/users-store';
import { ChatEvent } from '../enum/chat-event.enum';
import { Chatroom } from '../types/chatroom.type';
import { Message } from '../types/message.type';
import { User } from '../types/user.type';
import { SocketClient } from './socket-client';

type SocketClients = { [key: string]: SocketClient };

/*
 * SocketManager keeps track of socket connections and events.
 * It's pretty clunky right now with socket events split across here and SocketClient...
 */
export class SocketManager {
  private io: socket.Server;
  private socketClients: SocketClients = {};

  // todo investigate socket preappendListener(...)
  constructor(
    server: Server,
    private usersStore: UsersStore,
    private chatroomsStore: ChatroomsStore
  ) {
    this.io = socket(server);

    this.io.on(ChatEvent.CONNECT, (client: Socket) => {
      this.socketClients[client.id] = new SocketClient(client, usersStore);

      client.on(ChatEvent.DISCONNECT, () =>
        this.handleUserDisconnect(client.id)
      );
      client.on(ChatEvent.MESSAGE_USER, ({ toUserId, message }) =>
        this.handleMessageUser({
          toUserId,
          message,
          fromSocketClient: this.socketClients[client.id]
        })
      );
    });
  }

  public attachServer(server: Server): void {
    this.io.attach(server);
  }

  public handleUserDisconnect(clientId: string): void {
    delete this.socketClients[clientId];
  }

  public handleMessageUser({ toUserId, message, fromSocketClient }): void {
    const toSocketClient = this.getSocketClient(toUserId);
    const fromUserId = fromSocketClient.getUserId();
    const { username: fromUsername } = this.usersStore.getUser(fromUserId);

    const validMessageAttempt =
      toUserId && message && fromUserId && fromUsername && toSocketClient;

    if (!validMessageAttempt) {
      console.warn(`Invalid attempt to message user`, {
        toUserId,
        fromUserId,
        message
      });
      return undefined;
    }
    const newMessage: Message = {
      message,
      username: fromUsername,
      userId: fromUserId
    };

    this.io.to(toSocketClient.getClientId()).send(newMessage);
    this.io.to(fromSocketClient.getClientId()).send(newMessage);

    // todo add message to message history
    // this.usersStore.updateUserDetails(...)

    console.log(
      `${fromUsername} (${fromUserId}) messaged user ${toUserId}: ${message}`
    );
  }

  public broadcastNewChatroom(chatroom: Chatroom): void {
    console.log('Broadcasting new chatroom', chatroom);

    // todo in future make this only emit 'new chatroom'
    this.io.emit(ChatEvent.NEW_CHATROOM, this.chatroomsStore.getChatrooms());
  }

  public broadcastNewUser(user: User): void {
    console.log('Broadcasting new user', user);

    // todo in future make this only emit 'new user'
    this.io.emit(ChatEvent.NEW_USER, this.usersStore.getUsers());
  }

  public getSocketClient(userId: string): SocketClient {
    const client = Object.values(this.socketClients).find(
      socketClient => socketClient.getUserId() === userId
    );
    return client;
  }

  public getSocketConnections(): SocketClients {
    return this.socketClients;
  }
}
