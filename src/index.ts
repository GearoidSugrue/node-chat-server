import express, { Express } from 'express';
import http from 'http';
import socket from 'socket.io';

import { ChatApp } from './chat-app';
import { ChatServer } from './chat-server';
import { ChatroomsStore } from './data-store/chatroom-store';
import { UsersStore } from './data-store/users-store';
import { createChatBroadcaster } from './socket/chat-broadcaster';
import { createChatReceiver } from './socket/chat-receiver';
import { createSocketUsers } from './socket/socket-users-manager';

const app: Express = express();
const server = http.createServer(app);

const usersStore = new UsersStore();
const chatroomsStore = new ChatroomsStore();

const io = socket(server);
const chatBroadcaster = createChatBroadcaster(io);

const socketUsers = createSocketUsers(chatBroadcaster); // todo pass to express router
const chatReceiver = createChatReceiver(
  io,
  socketUsers,
  chatBroadcaster,
  usersStore,
  chatroomsStore
);

// const restController = ....(app, usersStore, chatroomsStore, chatBroadcaster);

// todo change to function
// todo add socketUsers
const chatApp = new ChatApp(app, chatBroadcaster, usersStore, chatroomsStore);

const chatServer = new ChatServer(server);
chatServer.startListening();

export { app, chatReceiver, chatApp };
