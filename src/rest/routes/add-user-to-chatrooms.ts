import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { ChatroomsStore, UsersStore } from '../../data-store';
import { Chatroom, Message, User } from '../../data-store/types';
import { ChatBroadcaster } from '../../socket/interfaces';
import { BodyParam, HeaderParam, PathParam } from '../enums';

export function createAddUserToChatroomsHandler(
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore,
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function addUserToChatroomsHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId: string = req.params[PathParam.userId];
    const chatroomIds: string[] = req.body[BodyParam.chatroomIds];
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId);

    const [updatedChatrooms] = await Promise.all([
      chatroomsStore.addMemberToChatrooms(chatroomIds, userId, requesterUserId),
      usersStore.addUserToChatrooms(userId, chatroomIds)
    ]);

    const { username }: User = await usersStore.getUser(userId);

    // TODO: fix - errors thrown in here are not being caught correctly
    const addUserJoinedMessage = async ({ chatroomId }: Chatroom) => {
      const newMemberMessage: Message = {
        userId,
        username,
        chatroomId,
        message: `${username} has joined the chat!`,
        timestamp: new Date().toISOString()
      };

      await chatroomsStore.addMessageToChatroom(
        chatroomId,
        requesterUserId,
        newMemberMessage
      );
      chatBroadcaster.sendChatroomMessage(chatroomId, newMemberMessage);
      chatBroadcaster.broadcastNewChatroomMember(chatroomId, userId);
    };

    await Promise.all(updatedChatrooms.map(addUserJoinedMessage));
    return res.send({ message: 'Success' });
  };
}

export function handleAddUserToChatroomsError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId: string = req.params[PathParam.userId];
  const chatroomsIds: string[] = req.body[BodyParam.chatroomIds];
  const addChatroomError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    "failed to add user '%s' to chatrooms '%s'",
    userId,
    JSON.stringify(chatroomsIds)
  );
  return next(addChatroomError);
}
