import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { ChatroomsStore } from '../../data-store';
import { Chatroom } from '../../data-store/types';
import { HeaderParam, PathParam } from '../enums';

export function createGetChatroomHandler(
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function getChatroomHandler(req: Request, res: Response) {
    const chatroomId: string = req.params[PathParam.chatroomId];
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId); // todo this should be gotten from token/session

    const chatroom: Chatroom = await chatroomsStore.getChatroom(
      chatroomId,
      requesterUserId
    );
    return res.send(chatroom);
  };
}

export function handleGetChatroomError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const chatroomId: string = req.params[PathParam.chatroomId];
  const getChatroomError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    "failed to get chatroom '%s'",
    chatroomId
  );
  return next(getChatroomError);
}
