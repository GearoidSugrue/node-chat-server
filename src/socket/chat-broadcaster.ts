import socket from 'socket.io';

import { Chatroom, Message, User } from '../data-store/types';
import { ChatEvent } from './enums';
import { UserOnlineStatus } from './types';

// tslint:disable-next-line: interface-name
export interface ChatBroadcaster {
  sendChatroomMessage: (chatroomId: string, message: Message) => void;
  sendDirectMessage: (clientIds: string[], message: Message) => void;
  broadcastOnlineStatus: (onlineStatus: UserOnlineStatus) => void;
  broadcastNewChatroom: (chatroom: Chatroom) => void;
  broadcastNewUser: (user: User) => void;
}

const createChatroomMessageSender = (io: socket.Server) => (
  chatroomId: string,
  message: Message
) => {
  io.to(chatroomId).send(message);
};

const createDirectMessageSender = (io: socket.Server) => (
  clientIds: string[],
  message: Message
) => {
  const uniqueClientIds = [...new Set(clientIds)];
  uniqueClientIds.forEach(clientId => {
    io.sockets.connected[clientId].send(message);
  });
};

const createOnlineStatusBroadcaster = (io: socket.Server) => (
  onlineStatus: UserOnlineStatus
) => io.emit(ChatEvent.ONLINE_STATUS_CHANGE, onlineStatus);

const createNewChatroomBroadcaster = (io: socket.Server) => (
  chatroom: Chatroom
) => io.emit(ChatEvent.NEW_CHATROOM, chatroom);

const createNewUserBroadcaster = (io: socket.Server) => (user: User) =>
  io.emit(ChatEvent.NEW_USER, user);

// todo investigate if usersStore and chatrooms store should be moved here instead of in chat-receiver
export function createChatBroadcaster(io: socket.Server): ChatBroadcaster {
  const sendChatroomMessage = createChatroomMessageSender(io);
  const sendDirectMessage = createDirectMessageSender(io);
  const broadcastOnlineStatus = createOnlineStatusBroadcaster(io);
  const broadcastNewChatroom = createNewChatroomBroadcaster(io);
  const broadcastNewUser = createNewUserBroadcaster(io);

  return {
    sendChatroomMessage,
    sendDirectMessage,
    broadcastOnlineStatus,
    broadcastNewChatroom,
    broadcastNewUser
  };
}
