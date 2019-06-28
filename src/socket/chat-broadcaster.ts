import socket from 'socket.io';

import { Chatroom, Message, User } from '../data-store/types';
import { ChatBroadcasterEvent } from './enums/chat-broadcaster-events';
import { ChatBroadcaster } from './interfaces';
import {
  ChatroomTypingEvent,
  DirectTypingEvent,
  UserOnlineStatus
} from './types';

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
) => io.emit(ChatBroadcasterEvent.ONLINE_STATUS_CHANGE, onlineStatus);

const createChatroomTypingChangeBroadcaster = (io: socket.Server) => (
  chatroomTypingChange: ChatroomTypingEvent
) => {
  io.to(chatroomTypingChange.toChatroomId).emit(
    ChatBroadcasterEvent.CHATROOM_TYPING_CHANGE,
    chatroomTypingChange
  );
  console.log('broadcasting user typing in chatroom change:', {
    chatroomTypingChange
  });
};

const createDirectTypingChangeSender = (io: socket.Server) => (
  clientId: string,
  directTypingChange: DirectTypingEvent
) => {
  io.sockets.connected[clientId].emit(
    ChatBroadcasterEvent.DIRECT_TYPING_CHANGE,
    directTypingChange
  );
  // io.emit(ChatBroadcasterEvent.CHATROOM_TYPING_CHANGE, typingChange);
  console.log('broadcasting user typing change:', { directTypingChange });
};

const createNewChatroomBroadcaster = (io: socket.Server) => (
  chatroom: Chatroom
) => io.emit(ChatBroadcasterEvent.NEW_CHATROOM, chatroom);

const createNewUserBroadcaster = (io: socket.Server) => (user: User) =>
  io.emit(ChatBroadcasterEvent.NEW_USER, user);

// todo investigate if usersStore and chatrooms store should be moved here instead of in chat-receiver
export function createChatBroadcaster(io: socket.Server): ChatBroadcaster {
  const sendChatroomMessage = createChatroomMessageSender(io);
  const sendDirectMessage = createDirectMessageSender(io);
  const broadcastOnlineStatus = createOnlineStatusBroadcaster(io);
  const broadcastChatroomTypingChange = createChatroomTypingChangeBroadcaster(
    io
  );
  const sendDirectTypingChange = createDirectTypingChangeSender(io);
  const broadcastNewChatroom = createNewChatroomBroadcaster(io);
  const broadcastNewUser = createNewUserBroadcaster(io);

  return {
    sendChatroomMessage,
    sendDirectMessage,
    broadcastOnlineStatus,
    broadcastChatroomTypingChange,
    sendDirectTypingChange,
    broadcastNewChatroom,
    broadcastNewUser
  };
}
