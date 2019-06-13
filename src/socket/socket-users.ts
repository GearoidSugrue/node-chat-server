import { ChatBroadcaster, SocketUsers } from './interfaces';
import { SocketUser } from './types';

type SocketUsersMap = {
  [userId: string]: SocketUser;
};

export function createSocketUsers(
  chatBroadcaster: ChatBroadcaster
): SocketUsers {
  const users: SocketUsersMap = {} as SocketUsersMap;

  function addUser({ userId, username, clientId }: SocketUser): SocketUser {
    const user = {
      userId,
      username,
      clientId
    };
    users[userId] = user;
    chatBroadcaster.broadcastOnlineStatus({ userId, online: true });
    return user;
  }

  function removeUser({ userId, clientId }: Partial<SocketUser>): void {
    if (userId) {
      delete users[userId];
      chatBroadcaster.broadcastOnlineStatus({ userId, online: false });
    } else if (clientId) {
      const userToRemove = Object.values(users).find(
        user => user.clientId === clientId
      );

      if (userToRemove) {
        delete users[userToRemove.userId];
        chatBroadcaster.broadcastOnlineStatus({
          userId: userToRemove.userId,
          online: false
        });
      }
    }
  }

  // todo should there be separate functions for clientId and userId?
  function getUser({ userId, clientId }: Partial<SocketUser>): SocketUser {
    if (userId) {
      return users[userId];
    } else if (clientId) {
      const clientIdUser = Object.values(users).find(
        user => user.clientId === clientId
      );
      return clientIdUser || ({} as SocketUser);
    }
  }

  function getUserOnlineStatus(userId: string) {
    const user = userId && users[userId];
    return Boolean(user);
  }

  return {
    addUser,
    removeUser,
    getUser,
    getUserOnlineStatus
  };
}
