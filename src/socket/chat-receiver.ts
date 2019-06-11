import socket, { Socket } from 'socket.io';

import { ChatroomsStore } from '../data-store/chatroom-store';
import { Message } from '../data-store/types';
import { UsersStore } from '../data-store/users-store';

import { ChatBroadcaster } from './chat-broadcaster';
import { ChatEvent } from './enums';
import { SocketUsers } from './socket-users';

const createUserLoginHandler = (
  socketUsers: SocketUsers,
  usersStore: UsersStore
) => (client: Socket) => ({ userId, username }) => {
  socketUsers.addUser({ userId, username, clientId: client.id });
  const { chatroomIds } = usersStore.getUser(userId);
  client.join(chatroomIds || []);
};

const createMessageChatroomHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  chatroomStore: ChatroomsStore
) => (client: Socket) => ({ chatroomId, message }) => {
  const { userId, username } = socketUsers.getUser({ clientId: client.id });

  const validMessageAttempt = userId && chatroomId;

  if (!validMessageAttempt) {
    console.warn(`Invalid attempt to message chatroom:`, {
      chatroomId,
      message,
      clientId: client.id
    });
    return undefined;
  }

  const newMessage: Message = {
    userId,
    chatroomId,
    username,
    message
  };
  chatBroadcaster.sendChatroomMessage(chatroomId, newMessage);

  // todo chatroomsStore needs to be updated with the message!
  // something like: chatroomStore.addMessage(chatroomId, newMessage)
  console.log(
    `${username} (${userId}) messaged chatroom ${chatroomId}: ${message}`
  );
};

const createMessageUserHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore
) => (client: Socket) => ({ toUserId, message }) => {
  const toSocketUser = socketUsers.getUser({ userId: toUserId });
  const fromSocketUser = socketUsers.getUser({ clientId: client.id });

  const validMessageAttempt = message && toSocketUser && fromSocketUser;

  if (!validMessageAttempt) {
    console.warn(`Invalid attempt to message user`, {
      toSocketUser,
      fromSocketUser,
      message
    });
    return undefined;
  }

  const newMessage: Message = {
    message,
    toUserId,
    username: fromSocketUser.username,
    userId: fromSocketUser.userId
  };
  chatBroadcaster.sendDirectMessage(
    [toSocketUser.clientId, fromSocketUser.clientId],
    newMessage
  );

  // todo add message to message history
  // usersStore.updateUserDetails(...) // or something like: messagesController.addMessage(...)

  console.log(
    `${fromSocketUser.username} messaged user ${
      toSocketUser.username
    }: ${message}`
  );
};

export function initializeChatSocketReceiver(
  io: socket.Server,
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore,
  chatroomsStore: ChatroomsStore
): void {
  const userLoginHandler = createUserLoginHandler(socketUsers, usersStore);
  const messageChatroomHandler = createMessageChatroomHandler(
    socketUsers,
    chatBroadcaster,
    chatroomsStore
  );
  const messageUserHandler = createMessageUserHandler(
    socketUsers,
    chatBroadcaster,
    usersStore
  );

  // todo investigate socket preappendListener(...) for logging purposes. Perhaps it can have it's own closure?

  io.on(ChatEvent.CONNECT, (client: Socket) => {
    // userId and username should come from token so this will need to refactored when auth is implemented!
    client.on(ChatEvent.LOGIN, userLoginHandler(client));
    client.on(ChatEvent.LOGOUT, () =>
      socketUsers.removeUser({ clientId: client.id })
    );
    // Front end will need to login again if a disconnect occurs. This should happen in the background.
    client.on(ChatEvent.DISCONNECT, () =>
      socketUsers.removeUser({ clientId: client.id })
    );
    client.on(ChatEvent.MESSAGE_CHATROOM, messageChatroomHandler(client));
    client.on(ChatEvent.MESSAGE_USER, messageUserHandler(client));
  });
}
