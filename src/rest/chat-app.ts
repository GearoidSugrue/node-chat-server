import assert from 'assert';
import cors from 'cors';
import express, { Express, Request, RequestHandler, Response } from 'express';

import { ChatroomsStore, UsersStore } from '../data-store';
import { Chatroom, Message, User } from '../data-store/types';
import { ChatBroadcaster, SocketUsers } from '../socket/interfaces';
import { endpoints, HeaderParam, PathParam } from './enums';
import {
  assertionErrorHandler,
  asyncWrapper,
  defaultErrorHandler,
  logErrorHandler
} from './middleware';

function createGetChatroomHandler(
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return function getChatroomHandler(req: Request, res: Response) {
    const chatroomId: string = req.params[PathParam.chatroomId];
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId); // todo this should be gotten from token/session
    const hasValidArgs: boolean = Boolean(chatroomId && requesterUserId); // other validators could be added in future. e.g. length

    if (!hasValidArgs) {
      assert.fail('Invalid chatroomId (path) or RequesterUserId (header)');
    }

    const chatroom: Chatroom = chatroomsStore.getChatroom(
      chatroomId,
      requesterUserId
    );
    return res.send(chatroom);
  };
}

function createGetChatroomMessagesHandler(
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return function getChatroomMessagesHandler(req: Request, res: Response) {
    const chatroomId: string = req.params[PathParam.chatroomId];
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId);
    const hasValidArgs: boolean = Boolean(chatroomId && requesterUserId);

    if (!hasValidArgs) {
      assert.fail('Invalid chatroomId (path) or RequesterUserId (header)');
    }

    const chatroom: Chatroom = chatroomsStore.getChatroom(
      chatroomId,
      requesterUserId
    );
    return res.send(chatroom.messages || []);
  };
}

function createGetUsersHandler(
  socketUsers: SocketUsers,
  usersStore: UsersStore
): RequestHandler {
  return function getUsersHandler(req: Request, res: Response) {
    const removeMessages = (user: User) => {
      const { messages, ...partialUser } = user;
      return partialUser;
    };
    const addOnlineStatus = (user: User): User => ({
      ...user,
      online: socketUsers.getUserOnlineStatus(user.userId)
    });

    const formattedUsers = usersStore
      .getUsers()
      .map(removeMessages) // removing messages from users until proper DB implementation is in place. Then they'll be no need for this.
      .map(addOnlineStatus);
    return res.send(formattedUsers);
  };
}

function createGetUserMessagesHandler(usersStore: UsersStore): RequestHandler {
  return function getUserMessagesHandler(req: Request, res: Response) {
    const userId: string = req.params[PathParam.userId] as string;
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId);
    const hasValidArgs: boolean = Boolean(userId && requesterUserId);

    if (!hasValidArgs) {
      assert.fail('Invalid userId (path) or RequesterUserId (header)');
    }

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
    const chatroomName: string = req.body.name;
    const requesterUserId = req.header(HeaderParam.RequesterUserId);
    const hasValidArgs: boolean = Boolean(chatroomName && requesterUserId);

    if (!hasValidArgs) {
      assert.fail('Invalid name (body) or RequesterUserId (header)');
    }

    const newChatroom: Chatroom = chatroomsStore.addChatroom(
      chatroomName,
      requesterUserId
    );

    if (newChatroom) {
      chatBroadcaster.broadcastNewChatroom(newChatroom);
      return res.status(201).send(newChatroom);
    }
  };
}

function createAddUserHandler(
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore
): RequestHandler {
  return function addUserHandler(req: Request, res: Response) {
    const username: string = req.body.username;
    const hasValidArgs: boolean = Boolean(username);

    if (!hasValidArgs) {
      assert.fail('Invalid username (body)');
    }

    const newUser: User = usersStore.addUser(username);

    if (newUser) {
      chatBroadcaster.broadcastNewUser(newUser);
      return res.status(201).send(newUser);
    }
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

  // todo might split up REST routes + handlers from the error and other middleware
  const getChatroomsHandler = (req: Request, res: Response) =>
    res.send(chatroomsStore.getChatrooms());

  const getChatroomHandler = createGetChatroomHandler(chatroomsStore);
  const getChatroomMessagesHandler = createGetChatroomMessagesHandler(
    chatroomsStore
  );
  const getUsersHandler = createGetUsersHandler(socketUsers, usersStore);
  const getUserMessagesHandler = createGetUserMessagesHandler(usersStore);
  const addChatroomHandler = createAddChatroomHandler(
    chatBroadcaster,
    chatroomsStore
  );
  const addUserHandler = createAddUserHandler(chatBroadcaster, usersStore);

  app.get(endpoints.chatrooms, asyncWrapper(getChatroomsHandler));
  app.get(endpoints.chatroom, asyncWrapper(getChatroomHandler));
  app.get(endpoints.chatroomMessages, asyncWrapper(getChatroomMessagesHandler));
  app.get(endpoints.users, asyncWrapper(getUsersHandler));
  app.get(endpoints.userMessages, asyncWrapper(getUserMessagesHandler));
  app.post(endpoints.chatrooms, asyncWrapper(addChatroomHandler));
  app.post(endpoints.users, asyncWrapper(addUserHandler));

  app.use(logErrorHandler);
  app.use(assertionErrorHandler);
  app.use(defaultErrorHandler);
}
