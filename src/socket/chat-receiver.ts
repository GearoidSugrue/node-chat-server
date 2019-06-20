import socket, { Socket } from 'socket.io';

import { ChatroomsStore, UsersStore } from '../data-store';
import { Message } from '../data-store/types';
import { ChatEvent } from './enums';
import { ChatBroadcaster, SocketUsers } from './interfaces';

const createUserLoginHandler = (
  socketUsers: SocketUsers,
  usersStore: UsersStore
) => (client: Socket) => ({ userId, username }) => {
  socketUsers.addUser({ userId, username, clientId: client.id });
  const { chatroomIds } = usersStore.getUser(userId);
  client.join(chatroomIds || []);
};

// todo investigate if send messages should be done through POST. REST has advantage of returning 400s, etc.
const createMessageChatroomHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  chatroomStore: ChatroomsStore
) => (client: Socket) => ({ chatroomId, message }) => {
  const { userId, username } = socketUsers.getUser({ clientId: client.id });

  const validMessageAttempt = userId && chatroomId;

  // todo investigate use of assert here and investigate error handlers for it
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
  const addMessageResult = chatroomStore.addMessageToChatroom(
    chatroomId,
    newMessage
  );

  if (addMessageResult) {
    chatBroadcaster.sendChatroomMessage(chatroomId, newMessage);
    console.log(
      `${username} (${userId}) messaged chatroom ${chatroomId}: ${message}`
    );
  } else {
    console.log('Failed to add message to chatroom');
  }
};

// todo investigate if send messages should be done through POST. REST has advantage of returning 400s, etc.
const createMessageUserHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore
) => (client: Socket) => ({ toUserId, message }) => {
  const fromSocketUser = socketUsers.getUser({ clientId: client.id });

  const validMessageAttempt = message && toUserId && fromSocketUser;

  if (!validMessageAttempt) {
    console.warn(`Invalid attempt to message user`, {
      toUserId,
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

  // This is super hacky! Messages are currently stored on the user's themselves,
  // so I have to add the new message to both users.
  // This will be replaced when implementing a proper DB implementation!
  const addMessageToUser = usersStore.addMessageToUser(
    toUserId,
    fromSocketUser.userId,
    newMessage
  );
  const addMessageToFromUser = usersStore.addMessageToUser(
    fromSocketUser.userId,
    toUserId,
    newMessage
  );

  if (addMessageToUser && addMessageToFromUser) {
    const toSocketUser = socketUsers.getUser({ userId: toUserId }); // if the other user is not logged, this will be {}

    const clientIds = Boolean(toSocketUser)
      ? [toSocketUser.clientId, fromSocketUser.clientId]
      : [fromSocketUser.clientId];
    chatBroadcaster.sendDirectMessage(clientIds, newMessage);

    console.log(
      `${fromSocketUser.username} messaged user ${
        Boolean(toSocketUser) ? toSocketUser.username : toUserId
      }: ${message}`
    );
  } else {
    console.log('Failed to add message to users');
  }
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
    // Front-end will need to login again if a disconnect occurs. This should happen in the background.
    client.on(ChatEvent.DISCONNECT, () =>
      socketUsers.removeUser({ clientId: client.id })
    );
    client.on(ChatEvent.MESSAGE_CHATROOM, messageChatroomHandler(client));
    client.on(ChatEvent.MESSAGE_USER, messageUserHandler(client));
  });
}
