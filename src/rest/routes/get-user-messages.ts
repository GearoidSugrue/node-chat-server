import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { UsersStore } from '../../data-store';
import { Message } from '../../data-store/types';
import { HeaderParam, PathParam } from '../enums';

export function createGetUserMessagesHandler(
  usersStore: UsersStore
): RequestHandler {
  return async function getUserMessagesHandler(req: Request, res: Response) {
    const userId: string = req.params[PathParam.userId];
    const requesterUserId: string = req.header(HeaderParam.RequesterUserId);

    const messages: Message[] = await usersStore.getUserMessages(
      userId,
      requesterUserId
    );
    return res.send(messages);
  };
}

export function handleGetUserMessagesError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId: string = req.params[PathParam.userId];
  const getUsersError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    "failed to get user '%s' messages",
    userId
  );
  return next(getUsersError);
}
