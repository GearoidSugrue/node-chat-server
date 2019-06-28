import { SocketUser } from '../types';

// tslint:disable-next-line: interface-name
export interface SocketUsers {
  addUser: (socketUser: SocketUser) => Promise<SocketUser>;
  removeUser: (socketUserDetails: Partial<SocketUser>) => Promise<void>;
  getUsersByUserIds: (userIds: string[]) => Promise<SocketUser[]>;
  getUserByUserId: (userId: string) => Promise<SocketUser>;
  getUserByClientId: (clientId: string) => Promise<SocketUser>;
  getUserOnlineStatus: (userId: string) => Promise<boolean>;
}
