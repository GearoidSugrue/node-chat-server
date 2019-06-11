import cors from 'cors';
import express, { Express, Request, RequestHandler, Response } from 'express';

import { ChatroomsStore } from '../data-store/chatroom-store';
import { Chatroom, Message, User } from '../data-store/types';
import { UsersStore } from '../data-store/users-store';
import { ChatBroadcaster } from '../socket/chat-broadcaster';
import { SocketUsers } from '../socket/socket-users';
import { Endpoint, HeaderParam, PathParam } from './enums';

// using a dictionary instead of enums as enums can't contain computed values. e.g. `/rooms/:${PathParam.chatroomId}/messages
const endpoints: Readonly<{ [key in Endpoint]: string }> = {
  [Endpoint.rooms]: '/rooms',
  [Endpoint.users]: '/users',
  [Endpoint.chatroomMessages]: `/rooms/:${PathParam.chatroomId}/messages`,
  [Endpoint.userMessages]: `/users/:${PathParam.userId}/messages`
};

function createGetUsersHandler(
  socketUsers: SocketUsers,
  usersStore: UsersStore
): RequestHandler {
  return function getUsersHandler(req: Request, res: Response) {
    const addOnlineStatus = (user: User): User => ({
      ...user,
      online: socketUsers.getUserOnlineStatus(user.userId)
    });
    const usersWithOnlineStatus = usersStore.getUsers().map(addOnlineStatus);
    return res.send(usersWithOnlineStatus);
  };
}

function createGetChatroomMessagesHandler(
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return function getChatroomMessagesHandler(
    req: Request,
    res: Response
  ): void {
    const chatroomId = req.params[PathParam.chatroomId] as string;
    const requesterUserId = req.header(HeaderParam.RequesterUserId); // todo this should be gotten from token/session

    const messages: Message[] = chatroomsStore.getChatroomMessages(
      chatroomId,
      requesterUserId
    );
    res.send(messages);
  };
}

function createGetUserMessagesHandler(usersStore: UsersStore): RequestHandler {
  return function getUserMessagesHandler(req: Request, res: Response) {
    const userId = req.params[PathParam.userId] as string;
    const requesterUserId = req.header(HeaderParam.RequesterUserId); // todo this should be gotten from token/session

    const messages: Message[] = usersStore.getUserMessages(
      userId,
      requesterUserId
    );
    return res.send(messages);
  };
}

function createAddChatroomHandler(
  chatBroadcaster: ChatBroadcaster,
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return function addChatroomHandler(req: Request, res: Response) {
    const chatroomName = req.body.name as string;
    const newChatroom: Chatroom = chatroomsStore.addChatroom(chatroomName);

    if (newChatroom) {
      chatBroadcaster.broadcastNewChatroom(newChatroom);
      return res.status(201).send(newChatroom);
    }
    return res.status(400).send({ message: 'Invalid chatroom name' });
  };
}

function createAddUserHandler(
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore
): RequestHandler {
  return function addUserHandler(req: Request, res: Response) {
    const username = req.body.username as string;
    const newUser: User = usersStore.addUser(username);

    if (newUser) {
      chatBroadcaster.broadcastNewUser(newUser);
      return res.status(201).send(newUser);
    }
    return res.status(400).send({ message: 'Invalid username' });
  };
}

export function initializeChatRestApp(
  app: Express,
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore,
  chatroomsStore: ChatroomsStore
): void {
  app.use(express.json());
  app.use(cors());

  const getUsersHandler = createGetUsersHandler(socketUsers, usersStore);
  const getChatroomMessagesHandler = createGetChatroomMessagesHandler(
    chatroomsStore
  );
  const getUserMessagesHandler = createGetUserMessagesHandler(usersStore);
  const addChatroomHandler = createAddChatroomHandler(
    chatBroadcaster,
    chatroomsStore
  );
  const addUserHandler = createAddUserHandler(chatBroadcaster, usersStore);

  app.get(endpoints.rooms, (req: Request, res: Response) =>
    res.send(chatroomsStore.getChatrooms())
  );
  app.get(endpoints.users, getUsersHandler);
  // todo add getChatroom. May not need getChatroomMessages?
  app.get(endpoints.chatroomMessages, getChatroomMessagesHandler);
  app.get(endpoints.userMessages, getUserMessagesHandler);
  app.post(endpoints.rooms, addChatroomHandler);
  app.post(endpoints.users, addUserHandler);
}
