import cors from 'cors';
import express, { Express } from 'express';

import { ChatroomsStore, UsersStore } from '../data-store';
import { ChatBroadcaster, SocketUsers } from '../socket/interfaces';
import { endpoints } from './enums';
import {
  assertionErrorHandler,
  asyncWrapper,
  defaultErrorHandler,
  logErrorHandler,
  unauthorizedErrorHandler
} from './middleware';
import {
  createAddChatroomHandler,
  createAddUserToChatroomsHandler,
  createCreateUserHandler,
  createGetChatroomHandler,
  createGetChatroomMessagesHandler,
  createGetChatroomsHandler,
  createGetUserMessagesHandler,
  createGetUsersHandler,
  handleAddUserToChatroomsError,
  handleCreateChatroomError,
  handleCreateUserError,
  handleGetChatroomError,
  handleGetChatroomMessagesError,
  handleGetChatroomsError,
  handleGetUserMessagesError,
  handleGetUsersError
} from './routes';

export function initializeChatRestApp(
  app: Express,
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore,
  chatroomsStore: ChatroomsStore
): void {
  app.use(express.json());
  app.use(cors());

  const getChatroomHandler = createGetChatroomHandler(chatroomsStore);
  const getChatroomsHandler = createGetChatroomsHandler(chatroomsStore);
  const getChatroomMessagesHandler = createGetChatroomMessagesHandler(
    chatroomsStore
  );
  const getUsersHandler = createGetUsersHandler(socketUsers, usersStore);
  const getUserMessagesHandler = createGetUserMessagesHandler(usersStore);
  const createChatroomHandler = createAddChatroomHandler(
    chatBroadcaster,
    usersStore,
    chatroomsStore
  );
  const createUserHandler = createCreateUserHandler(
    chatBroadcaster,
    usersStore
  );
  const addUserToChatroomsHandler = createAddUserToChatroomsHandler(
    chatBroadcaster,
    usersStore,
    chatroomsStore
  );

  app.get(
    endpoints.chatroom,
    asyncWrapper(getChatroomHandler),
    handleGetChatroomError
  );
  app.get(
    endpoints.chatrooms,
    asyncWrapper(getChatroomsHandler),
    handleGetChatroomsError
  );
  app.get(
    endpoints.chatroomMessages,
    asyncWrapper(getChatroomMessagesHandler),
    handleGetChatroomMessagesError
  );
  app.get(endpoints.users, asyncWrapper(getUsersHandler), handleGetUsersError);
  app.get(
    endpoints.userMessages,
    asyncWrapper(getUserMessagesHandler),
    handleGetUserMessagesError
  );
  app.post(
    endpoints.chatrooms,
    asyncWrapper(createChatroomHandler),
    handleCreateChatroomError
  );
  app.post(
    endpoints.users,
    asyncWrapper(createUserHandler),
    handleCreateUserError
  );
  app.put(
    endpoints.userChatrooms,
    asyncWrapper(addUserToChatroomsHandler),
    handleAddUserToChatroomsError
  );

  app.use(logErrorHandler);
  app.use(assertionErrorHandler);
  app.use(unauthorizedErrorHandler);
  app.use(defaultErrorHandler);
}
