import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { ChatroomsStore, UsersStore } from '../../data-store';
import { Chatroom, Message, User } from '../../data-store/types';
import { ChatBroadcaster, SocketUsers } from '../../socket/interfaces';
import { SocketUser } from '../../socket/types';
import { BodyParam, HeaderParam } from '../enums';

export function createAddChatroomHandler(
  socketUsers: SocketUsers,
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore,
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function addChatroomHandler(req: Request, res: Response) {
    const chatroomName: string = req.body[BodyParam.name];
    const memberIds: string[] = req.body[BodyParam.memberIds];
    const requesterUserId = req.header(HeaderParam.RequesterUserId);

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
      message: `${username} has created chatroom # ${chatroomName}`,
      timestamp: new Date().toISOString()
    };

    await chatroomsStore.addMessageToChatroom(
      newChatroom.chatroomId,
      requesterUserId,
      createdChatroomMessage
    );

    const members: SocketUser[] = await socketUsers.getUsersByUserIds(
      newChatroom.memberIds
    );

    const loggedInUserPredicate = (socketUser: SocketUser) =>
      Boolean(socketUser);

    const membersClientIds: string[] = members
      .filter(loggedInUserPredicate)
      .map(socketUser => socketUser.clientId);
    chatBroadcaster.broadcastNewChatroom(newChatroom, membersClientIds);
    chatBroadcaster.sendChatroomMessage(
      newChatroom.chatroomId,
      createdChatroomMessage
    );

    return res.status(201).send(newChatroom);
  };
}

export function handleCreateChatroomError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const chatroomName: string = req.body[BodyParam.name];
  const addChatroomError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    "failed to create chatroom '%s'",
    chatroomName
  );
  return next(addChatroomError);
}
