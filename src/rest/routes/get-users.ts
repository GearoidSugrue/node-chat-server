import { NextFunction, Request, RequestHandler, Response } from 'express';
import { VError } from 'verror';

import { UsersStore } from '../../data-store';
import { User } from '../../data-store/types';
import { SocketUsers } from '../../socket/interfaces';

export function createGetUsersHandler(
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

export function handleGetUsersError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const getUsersError: Error = new VError(
    {
      name: 'RequestError',
      cause: err
    },
    'failed to get users'
  );
  return next(getUsersError);
}
