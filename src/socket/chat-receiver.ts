import socket, { Socket } from 'socket.io';

import { ChatroomsStore, UsersStore } from '../data-store';
import { Message } from '../data-store/types';
import { ChatEvent } from './enums';
import { ChatBroadcaster, SocketUsers } from './interfaces';
import {
  ChatroomTypingEvent,
  DirectTypingEvent,
  LoginEvent,
  MessageChatroomEvent,
  MessageUserEvent,
  SocketUser
} from './types';

const createUserLoginHandler = (
  socketUsers: SocketUsers,
  usersStore: UsersStore
) => (client: Socket) => async ({ userId, username }: LoginEvent) => {
  try {
    const { chatroomIds } = await usersStore.getUser(userId);
    await socketUsers.addUser({ userId, username, clientId: client.id });
    client.join(chatroomIds || []);
  } catch (err) {
    // todo implement proper error handling...
    console.log('failed to login user:', err.message);
  }
};

// todo investigate if send messages should be done through POST. REST has advantage of returning 400s, etc.
const createMessageChatroomHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  chatroomStore: ChatroomsStore
) => (client: Socket) => async ({
  chatroomId,
  message
}: MessageChatroomEvent) => {
  try {
    const { userId, username } = await socketUsers.getUserByClientId(client.id);

    const newMessage: Message = {
      userId,
      chatroomId,
      username,
      message,
      timestamp: new Date().toISOString()
    };
    await chatroomStore.addMessageToChatroom(chatroomId, userId, newMessage);

    chatBroadcaster.sendChatroomMessage(chatroomId, newMessage);
    console.log(
      `${username} (${userId}) messaged chatroom ${chatroomId}: ${message}`
    );
  } catch (err) {
    console.log('failed to add message to chatroom:', err.message);
  }
};

// todo investigate if send messages should be done through POST. REST has advantage of returning 400s, etc.
const createMessageUserHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore
) => (client: Socket) => async ({ toUserId, message }: MessageUserEvent) => {
  try {
    const fromSocketUser = await socketUsers.getUserByClientId(client.id);

    const newMessage: Message = {
      message,
      toUserId,
      username: fromSocketUser.username,
      userId: fromSocketUser.userId,
      timestamp: new Date().toISOString()
    };

    // This is super hacky! User-to-User messages are currently stored on the user's themselves,
    // so I have to add the new message to both users.
    // This will be hopefully be replaced when implementing a real DB!
    await usersStore.addMessageToUser(
      toUserId,
      fromSocketUser.userId,
      newMessage
    );

    const isUniqueUsers = toUserId !== fromSocketUser.userId;

    if (isUniqueUsers) {
      await usersStore.addMessageToUser(
        fromSocketUser.userId,
        toUserId,
        newMessage
      );
    }

    const toSocketUser = await socketUsers
      .getUserByUserId(toUserId)
      .catch((err: Error) => {
        if (err.name === 'Argument Error') {
          console.warn('user not online:', err.message);
          return undefined;
        }
        throw err;
      });

    const clientIds = Boolean(toSocketUser)
      ? [toSocketUser.clientId, fromSocketUser.clientId]
      : [fromSocketUser.clientId];
    chatBroadcaster.sendDirectMessage(clientIds, newMessage);

    console.log(
      `${fromSocketUser.username} messaged user ${
        Boolean(toSocketUser) ? toSocketUser.username : toUserId
      }: ${message}`
    );
  } catch (err) {
    console.log('failed to add message to user:', err.message);
    throw err;
  }
};

const createTypingInChatroomHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster
) => (client: Socket) => async ({
  typing,
  toChatroomId
}: Partial<ChatroomTypingEvent>) => {
  try {
    const fromSocketUser = await socketUsers.getUserByClientId(client.id);

    const userTypingChatroom: ChatroomTypingEvent = {
      typing,
      toChatroomId,
      userId: fromSocketUser.userId,
      username: fromSocketUser.username
    };

    chatBroadcaster.broadcastChatroomTypingChange(userTypingChatroom);
  } catch (err) {
    console.log(
      'failed to broadcast user typing in chatroom change:',
      err.message
    );
    throw err;
  }
};

const createTypingDirectHandler = (
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster
) => (client: Socket) => async ({
  typing,
  toUserId
}: Partial<DirectTypingEvent>) => {
  try {
    const fromUserPromise: Promise<SocketUser> = socketUsers.getUserByClientId(
      client.id
    );
    const toUserPromise: Promise<SocketUser> = socketUsers
      .getUserByUserId(toUserId)
      .catch(err => {
        console.log(`user '${toUserId}' is offline`);
        return {} as SocketUser;
      });

    const [fromUser, toUser] = await Promise.all([
      fromUserPromise,
      toUserPromise
    ]);

    if (toUser) {
      const userTypingChatroom: DirectTypingEvent = {
        typing,
        toUserId,
        userId: fromUser.userId,
        username: fromUser.username
      };
      chatBroadcaster.sendDirectTypingChange(
        toUser.clientId,
        userTypingChatroom
      );
    }
  } catch (err) {
    console.log('failed to broadcast user typing direct change:', err.message);
    throw err;
  }
};

// todo add typing and stop typing event handlers. *Must be room/user specific!

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
  const typingInChatroomHandler = createTypingInChatroomHandler(
    socketUsers,
    chatBroadcaster
  );
  const typingDirectHandler = createTypingDirectHandler(
    socketUsers,
    chatBroadcaster
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
    client.on(ChatEvent.CHATROOM_TYPING, typingInChatroomHandler(client));
    client.on(ChatEvent.DIRECT_TYPING, typingDirectHandler(client));

    client.on('error', (err: Error) => {
      console.log('An error ocurred!!!', err.message);
    });
  });
}

/* todo implement handlers on the ui and on node server for:

Connecting − When the client is in the process of connecting.

Disconnect − When the client is disconnected.

Connect_failed − When the connection to the server fails.

Error − An error event is sent from the server.

Message − When the server sends a message using the send function.

Reconnect − When reconnection to the server is successful.

Reconnecting − When the client is in the process of connecting.

Reconnect_failed − When the reconnection attempt fails.

*/
