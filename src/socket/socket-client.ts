import { Socket } from 'socket.io';
import { UsersStore } from '../data-store/users-store';
import { ChatEvent } from '../enum/chat-event.enum';
import { User } from '../types/user.type';

export class SocketClient {
  private userId = '';

  // private user: User;

  // todo should probably remove usersStore from here!
  // todo perhaps pass in io functions rather than all of io?
  constructor(
    private io,
    private client: Socket,
    private usersStore: UsersStore
  ) {
    client.on(ChatEvent.LOGOUT, () => this.logout());

    // using login for both login and creating users for now. Will split it out later. Probably make it a POST.
    // Also, userId should come from token middleware rather than front-end
    client.on(ChatEvent.LOGIN, ({ userId }: Partial<User>) =>
      this.login(userId)
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
    this.broadcastLoggedInChange({ userId: this.userId, online: false });
    this.userId = '';
    this.client.leaveAll();
  }

  public login(userId: string): void {
    const user = this.usersStore.getUser(userId);

    if (user) {
      this.userId = userId;
      this.client.join(user.chatroomIds || []);
      this.broadcastLoggedInChange({ userId, online: true });
    }
  }

  public broadcastLoggedInChange({ userId, online }) {
    const onlineStatus = {
      userId,
      online
    };
    console.log('User online status change', onlineStatus);

    this.io.emit(ChatEvent.ONLINE_STATUS_CHANGE, onlineStatus);
  }

  public joinChatroom(chatroomId: string): void {
    this.client.join(chatroomId);
    console.log(`Client '${this.client.id}' joined chatroom '${chatroomId}'`);
  }

  public leaveChatroom(chatroomId: string): void {
    this.client.leave(chatroomId);
    console.log(`Client '${this.client.id}' left chatroom '${chatroomId}'`);
  }
}
