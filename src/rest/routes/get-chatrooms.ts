import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { ChatroomsStore } from '../../data-store';

export function createGetChatroomsHandler(
  chatroomsStore: ChatroomsStore
): RequestHandler {
  return async function getChatroomHandler(req: Request, res: Response) {
    const chatrooms = await chatroomsStore.getChatrooms();
    return res.send(chatrooms);
  };
}

export function handleGetChatroomsError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const getChatroomsError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    'failed to get chatrooms'
  );
  return next(getChatroomsError);
}
