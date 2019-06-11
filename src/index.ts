import express, { Express } from 'express';
import http, { Server } from 'http';
import socket from 'socket.io';

import { initializeChatServer } from './chat-server';
import { ChatroomsStore } from './data-store/chatroom-store';
import { UsersStore } from './data-store/users-store';
import { initializeChatRestApp } from './rest/chat-app';
import {
  ChatBroadcaster,
  createChatBroadcaster
} from './socket/chat-broadcaster';
import { initializeChatSocketReceiver } from './socket/chat-receiver';
import { createSocketUsers, SocketUsers } from './socket/socket-users';

const app: Express = express();
const server: Server = http.createServer(app);

// todo these two should be replaced with a proper database implementation
const usersStore = new UsersStore();
const chatroomsStore = new ChatroomsStore();

const io = socket(server);

const chatBroadcaster: ChatBroadcaster = createChatBroadcaster(io);
const socketUsers: SocketUsers = createSocketUsers(chatBroadcaster); // todo pass to express router

initializeChatSocketReceiver(
  io,
  socketUsers,
  chatBroadcaster,
  usersStore,
  chatroomsStore
);
initializeChatRestApp(
  app,
  socketUsers,
  chatBroadcaster,
  usersStore,
  chatroomsStore
);
initializeChatServer(server);

export { app };
