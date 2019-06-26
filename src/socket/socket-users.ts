import assert from 'assert';

import { ChatBroadcaster, SocketUsers } from './interfaces';
import { SocketUser } from './types';

type SocketUsersMap = {
  [userId: string]: SocketUser;
};

/**
 * Acts as store for socket users.
 * This will most likely be refactored to use an external data source like redis
 * @param chatBroadcaster
 */
export function createSocketUsers(
  chatBroadcaster: ChatBroadcaster
): SocketUsers {
  const users: SocketUsersMap = {} as SocketUsersMap;

  async function addUser({
    userId,
    username,
    clientId
  }: SocketUser): Promise<SocketUser> {
    const user = {
      userId,
      username,
      clientId
    };
    users[userId] = user;
    chatBroadcaster.broadcastOnlineStatus({ userId, online: true });
    return user;
  }

  async function removeUser({
    userId,
    clientId
  }: Partial<SocketUser>): Promise<void> {
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

  async function getUserByUserId(userId: string): Promise<SocketUser> {
    assert.ok(Boolean(userId), "argument 'userId' is missing");
    assert.strictEqual(
      typeof userId,
      'string',
      "argument 'userId' must be a string"
    );

    const user: SocketUser = users[userId];

    if (!user) {
      const userNotFoundError = new Error(
        `User with userID '${userId}' not found`
      );
      userNotFoundError.name = 'Argument Error';
      throw userNotFoundError;
    }
    return user;
  }

  async function getUserByClientId(clientId: string): Promise<SocketUser> {
    assert.ok(Boolean(clientId), "argument 'clientId' is missing");
    assert.strictEqual(
      typeof clientId,
      'string',
      "argument 'userId' must be a string"
    );

    const clientIdUser: SocketUser = Object.values(users).find(
      user => user.clientId === clientId
    );

    if (!clientIdUser) {
      const userNotFoundError = new Error(
        `User with  clientId '${clientId}' not found`
      );
      userNotFoundError.name = 'Argument Error';
      throw userNotFoundError;
    }

    return clientIdUser;
  }

  async function getUserOnlineStatus(userId: string): Promise<boolean> {
    const user = userId && users[userId];
    return Boolean(user);
  }

  return {
    addUser,
    removeUser,
    getUserByUserId,
    getUserByClientId,
    getUserOnlineStatus
  };
}
