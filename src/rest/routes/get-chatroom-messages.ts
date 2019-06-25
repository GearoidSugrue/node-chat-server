import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { ChatroomsStore } from '../../data-store';
import { Chatroom } from '../../data-store/types';
import { HeaderParam, PathParam } from '../enums';

export function createGetChatroomMessagesHandler(
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function getChatroomMessagesHandler(
    req: Request,
    res: Response
  ) {
    const chatroomId: string = req.params[PathParam.chatroomId];
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId);

    const chatroom: Chatroom = await chatroomsStore.getChatroom(
      chatroomId,
      requesterUserId
    );
    return res.send(chatroom.messages || []);
  };
}

export function handleGetChatroomMessagesError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const chatroomId: string = req.params[PathParam.chatroomId];
  const getChatroomMessagesError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    "failed to get chatroom '%s' messages",
    chatroomId
  );
  return next(getChatroomMessagesError);
}
