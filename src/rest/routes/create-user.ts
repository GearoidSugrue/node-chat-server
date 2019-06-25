import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { UsersStore } from '../../data-store';
import { User } from '../../data-store/types';
import { ChatBroadcaster } from '../../socket/interfaces';
import { BodyParam } from '../enums';

export function createCreateUserHandler(
  chatBroadcaster: ChatBroadcaster,
  usersStore: UsersStore
): RequestHandler {
  return async function createUserHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const username: string = req.body[BodyParam.username];

    const newUser: User = await usersStore.addUser(username);
    chatBroadcaster.broadcastNewUser(newUser);

    return res.status(201).send(newUser);
  };
}

export function handleCreateUserError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const username: string = req.body[BodyParam.username];
  const addChatroomError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    "failed to create user '%s'",
    username
  );
  return next(addChatroomError);
}
