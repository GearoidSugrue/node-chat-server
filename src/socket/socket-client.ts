import { Socket } from 'socket.io';
import { UsersStore } from '../data-store/users-store';
import { ChatEvent } from '../enum/chat-event.enum';
import { Message } from '../types/message.type';
import { User } from '../types/user.type';

export class SocketClient {
  private userId = '';

  // private user: User;

  // todo should probably remove usersStore from here!
  constructor(private client: Socket, private usersStore: UsersStore) {
    client.on(ChatEvent.LOGOUT, () => this.logout());

    // using login for both login and creating users for now. Will split it out later. Probably make it a POST.
    // Also, userId should come from token middleware rather than front-end
    client.on(ChatEvent.LOGIN, ({ userId }: Partial<User>) =>
      this.login(userId)
    );
    client.on(ChatEvent.MESSAGE_CHATROOM, ({ chatroom, message }) =>
      this.sendMessageToChatroom({ chatroom, message })
    );
  }

  public isLoggedIn(): boolean {
    return Boolean(this.userId);
  }

  public getUserId(): string {
    return this.userId;
  }

  public getClientId(): string {
    return this.client.id;
  }

  public logout(): void {
    this.userId = '';
    this.broadcastLoggedInChange({ online: false });
    this.client.leaveAll();
  }

  public login(userId: string): void {
    const user = this.usersStore.getUser(userId);

    if (user) {
      this.userId = userId;
      const userChatroomsIds = []; // todo implement: user.getChatroomsIds();
      this.client.join(userChatroomsIds);
      this.broadcastLoggedInChange({ online: true });
    }
  }

  public broadcastLoggedInChange({ online }) {
    const onlineStatus = {
      online,
      userId: this.userId
    };
    console.log('User online status change', onlineStatus);

    this.client.emit(ChatEvent.ONLINE_STATUS_CHANGE, onlineStatus);
  }

  public joinChatroom(chatroomId: string): void {
    this.client.join(chatroomId);
    console.log(`Client '${this.client.id}' joined chatroom '${chatroomId}'`);
  }

  public leaveChatroom(chatroomId: string): void {
    this.client.leave(chatroomId);
    console.log(`Client '${this.client.id}' left chatroom '${chatroomId}'`);
  }

  public sendMessageToChatroom({ chatroom, message }): void {
    if (!this.userId) {
      console.warn(`Invalid attempt to message chatroom:`, {
        chatroom,
        message,
        clientId: this.client.id
      });
      return undefined;
    }
    const { username } = this.usersStore.getUser(this.userId);

    const newMessage: Message = {
      chatroom,
      username,
      message,
      userId: this.userId
    };

    this.client.to(chatroom).send(newMessage);

    // todo chatroomsStore needs to be updated with the message!!!
    console.log(
      `${username} (${this.userId}) messaged chatroom ${chatroom}: ${message}`
    );
  }
}
