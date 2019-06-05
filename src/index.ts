import express, { Express } from 'express';
import http from 'http';

import { ChatApp } from './chat-app';
import { ChatServer } from './chat-server';
import { ChatroomsStore } from './data-store/chatroom-store';
import { UsersStore } from './data-store/users-store';
import { SocketManager } from './socket/socket-manager';

const app: Express = express();
const server = http.createServer(app);

const usersStore = new UsersStore();
const chatroomsStore = new ChatroomsStore();

const socketManager = new SocketManager(server, usersStore, chatroomsStore); // socket: Socket // userStore: UsersStore?

// todo change to function
const chatApp = new ChatApp(app, socketManager, usersStore, chatroomsStore);

const chatServer = new ChatServer(server);
chatServer.startListening();

export { app, chatApp };
