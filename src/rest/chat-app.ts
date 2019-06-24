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

function createGetChatroomsHandler(
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function getChatroomHandler(req: Request, res: Response) {
    const chatrooms = await chatroomsStore.getChatrooms();
    return res.send(chatrooms);
  };
}

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
  return async function getUsersHandler(req: Request, res: Response) {
    const removeMessages = (user: User) => {
      const { messages, ...partialUser } = user;
      return partialUser;
    };
    const addOnlineStatus = (user: User): User => ({
      ...user,
      online: socketUsers.getUserOnlineStatus(user.userId)
    });

    const users = await usersStore.getUsers();
    const formattedUsers = users
      .map(removeMessages) // removing messages from users until proper DB implementation is in place. Then they'll be no need for this.
      .map(addOnlineStatus);
    return res.send(formattedUsers);
  };
}

function createGetUserMessagesHandler(usersStore: UsersStore): RequestHandler {
  return async function getUserMessagesHandler(req: Request, res: Response) {
    const userId: string = req.params[PathParam.userId] as string;
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId);

    const hasValidArgs: boolean = Boolean(userId && requesterUserId);

    if (!hasValidArgs) {
      assert.fail('Invalid userId (path) or RequesterUserId (header)');
    }

    const messages: Message[] = await usersStore.getUserMessages(
      userId,
      requesterUserId
    );
    return res.send(messages);
  };
}

function createAddChatroomHandler(
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore,
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function addChatroomHandler(req: Request, res: Response) {
    const chatroomName: string = req.body.name;
    const memberIds: string[] = req.body.memberIds;
    const requesterUserId = req.header(HeaderParam.RequesterUserId);

    const hasValidArgs: boolean = Boolean(
      chatroomName && memberIds && requesterUserId
    );

    if (!hasValidArgs) {
      assert.fail(
        'Invalid name (body) or RequesterUserId (header) or memberIds (body)'
      );
    }

    const newChatroom: Chatroom = await chatroomsStore.createChatroom(
      chatroomName,
      requesterUserId,
      memberIds
    );

    const { username }: User = await usersStore.getUser(requesterUserId);

    const createdChatroomMessage: Message = {
      username,
      chatroomId: newChatroom.chatroomId,
      userId: requesterUserId,
      message: `${username} has created #${chatroomName}!`,
      timestamp: new Date().toISOString()
    };

    chatBroadcaster.broadcastNewChatroom(newChatroom);
    await chatroomsStore.addMessageToChatroom(
      newChatroom.chatroomId,
      createdChatroomMessage
    );
    chatBroadcaster.sendChatroomMessage(
      newChatroom.chatroomId,
      createdChatroomMessage
    );

    return res.status(201).send(newChatroom);
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

function createAddUserToChatroomHandler(
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore,
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function addUserToChatroomHandler(req: Request, res: Response) {
    const userId: string = req.params[PathParam.userId] as string;
    const chatroomsIds: string[] = req.body.chatroomIds;

    const hasUserId = Boolean(userId);
    const hasChatroomIds = Boolean(chatroomsIds && chatroomsIds.length);

    if (!hasUserId || !hasChatroomIds) {
      assert.fail('Invalid userId (path) and/or chatroomIds (body');
    }

    const [updatedChatrooms] = await Promise.all([
      chatroomsStore.addMemberToChatrooms(chatroomsIds, userId),
      usersStore.addUserToChatrooms(userId, chatroomsIds)
    ]);

    const { username }: User = await usersStore.getUser(userId);

    await Promise.all(
      updatedChatrooms.map(({ chatroomId }: Chatroom) => {
        const newMemberMessage: Message = {
          userId,
          username,
          chatroomId,
          message: `${username} has joined the chat!`,
          timestamp: new Date().toISOString()
        };
        chatroomsStore.addMessageToChatroom(chatroomId, newMemberMessage);
        chatBroadcaster.sendChatroomMessage(chatroomId, newMemberMessage);
        // chatBroadcaster.broadcastNewChatroomMember();
      })
    );

    return res.send({ message: 'Success' });
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

  const getChatroomsHandler = createGetChatroomsHandler(chatroomsStore);
  const getChatroomHandler = createGetChatroomHandler(chatroomsStore);
  const getChatroomMessagesHandler = createGetChatroomMessagesHandler(
    chatroomsStore
  );
  const getUsersHandler = createGetUsersHandler(socketUsers, usersStore);
  const getUserMessagesHandler = createGetUserMessagesHandler(usersStore);
  const addChatroomHandler = createAddChatroomHandler(
    chatBroadcaster,
    usersStore,
    chatroomsStore
  );
  const addUserHandler = createAddUserHandler(chatBroadcaster, usersStore);
  const addUserToChatroomsHandler = createAddUserToChatroomHandler(
    chatBroadcaster,
    usersStore,
    chatroomsStore
  );

  app.get(endpoints.chatrooms, asyncWrapper(getChatroomsHandler));
  app.get(endpoints.chatroom, asyncWrapper(getChatroomHandler));
  app.get(endpoints.chatroomMessages, asyncWrapper(getChatroomMessagesHandler));
  app.get(endpoints.users, asyncWrapper(getUsersHandler));
  app.get(endpoints.userMessages, asyncWrapper(getUserMessagesHandler));
  app.post(endpoints.chatrooms, asyncWrapper(addChatroomHandler));
  app.post(endpoints.users, asyncWrapper(addUserHandler));
  app.put(endpoints.userChatrooms, asyncWrapper(addUserToChatroomsHandler));

  app.use(logErrorHandler);
  app.use(assertionErrorHandler);
  app.use(defaultErrorHandler);
}
