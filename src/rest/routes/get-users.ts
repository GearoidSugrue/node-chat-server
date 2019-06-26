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
    const removeMessages = (user: User): Partial<User> => {
      const { messages, ...partialUser } = user;
      return partialUser;
    };

    const addOnlineStatus = async (user: User): Promise<User> => {
      const online = await socketUsers
        .getUserOnlineStatus(user.userId)
        .catch(({ name, message }: Error) => {
          const errMessage = `${name} - ${message}`;
          console.warn(
            `failed to get user '${user.userId}' online status: ${errMessage}`
          );
          return false; // no point failing whole request so defaulting to "online: false" if error occurs, at least for now
        });

      return {
        ...user,
        online
      };
    };

    const users = await usersStore.getUsers();
    const formattedUsers = await Promise.all(
      users
        .map(removeMessages) // removing messages from users until proper DB implementation is in place. Then they'll be no need for this.
        .map(addOnlineStatus)
    );
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
