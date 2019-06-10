import cors from 'cors';
import express, { Express } from 'express';

import { ChatroomsStore } from './data-store/chatroom-store';
import { UsersStore } from './data-store/users-store';
import { ChatBroadcaster } from './socket/chat-broadcaster';
import { User } from './types/user.type';

export class ChatApp {
  constructor(
    app: Express,
    chatBroadcaster: ChatBroadcaster,
    usersStore: UsersStore,
    chatroomsStore: ChatroomsStore
  ) {
    app.use(express.json());
    app.use(cors());

    app.get('/rooms', (req, res) => res.send(chatroomsStore.getChatrooms()));
    app.get('/users', (req, res) => res.send(usersStore.getUsers()));

    app.get('/rooms/:chatroomId', (req, res) => {
      const chatroomId: string = req.params.chatroomId;
      // const requesterUserId = req.header('RequesterUserId'); // todo this should be gotten from token/session
      console.log('GET chatroom:', chatroomId);
      res.send(chatroomsStore.getChatroom(chatroomId));
    });

    app.get('/rooms/:chatroomId/messages', (req, res) => {
      const chatroomId: string = req.params.chatroomId;
      const requesterUserId = req.header('RequesterUserId'); // todo this should be gotten from token/session

      console.log('GET chatroom messages:', chatroomId);

      const messages = chatroomsStore.getChatroomMessages(
        chatroomId,
        requesterUserId
      );
      res.send(messages);
    });

    app.get('/users/:userId/messages', (req, res) => {
      const userId: string = req.params.userId;
      const requesterUserId = req.header('RequesterUserId'); // todo this should be gotten from token/session
      const messages = usersStore.getUserMessages(userId, requesterUserId);

      console.log('GET user messages:', {
        userId,
        requesterUserId,
        messages
      });
      res.send(messages);
    });

    app.post('/rooms', (req, res) => {
      const chatroomName: string = req.body.name;
      const newChatroom = chatroomsStore.addChatroom(chatroomName);

      if (newChatroom) {
        chatBroadcaster.broadcastNewChatroom(newChatroom);
        return res.send(newChatroom);
      }
      return res.status(400).send({ message: 'Invalid chatroom name' });
    });

    // app.post('/users, usersContoller.createUser(...));
    app.post('/users', (req, res) => {
      const username: string = req.body.username;
      const newUser: User = usersStore.addUser(username);

      if (newUser) {
        chatBroadcaster.broadcastNewUser(newUser);
        return res.send(newUser);
      }
      return res.status(400).send({ message: 'Invalid username' });
    });

    /*
  const usersController = new UserController(chatBroadcaster, usersStore);
  ...usersController.createUser(...)
  
  createUser(name: string) {
    const user = this.this.usersStore.addUser(name);
    this.chatBroadcaster.broadcastNewUser(user);
    console.log('....');
  }

  */

    /*
  const chatroomsController = new UserController(chatBroadcaster, usersStore);
  ...chatroomsController.createChatroom(...)
  
  createChatroom(name: string) {
    const chatroom = this.chatroomsStore.addChatroom(name);
    this.chatBroadcaster.broadcastNewChatroom(chatroom);
    console.log('....');
  }
  */
  }
}
