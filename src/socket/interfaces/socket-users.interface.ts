import { SocketUser } from '../types';

// tslint:disable-next-line: interface-name
export interface SocketUsers {
  addUser: (socketUser: SocketUser) => void;
  removeUser: (socketUserDetails: Partial<SocketUser>) => void;
  getUser: (socketUserDetails: Partial<SocketUser>) => SocketUser;
  getUserOnlineStatus: (userId: string) => boolean;
}
