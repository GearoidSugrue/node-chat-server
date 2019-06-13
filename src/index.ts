import express, { Express } from 'express';
import http, { Server } from 'http';
import socket, { ServerOptions } from 'socket.io';

import { initializeChatServer } from './chat-server';
import { ChatroomsStore, UsersStore } from './data-store';
import { initializeChatRestApp } from './rest';
import {
  createChatBroadcaster,
  createSocketUsers,
  initializeChatSocketReceiver
} from './socket';
import { ChatBroadcaster, SocketUsers } from './socket/interfaces';

const app: Express = express();
const server: Server = http.createServer(app);

// todo these two should be replaced with a proper database implementation
const usersStore = new UsersStore();
const chatroomsStore = new ChatroomsStore();

const socketOptions: ServerOptions = {
  cookie: false
};
const io = socket(server, socketOptions);

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
