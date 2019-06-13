import { Chatroom, Message, User } from '../../data-store/types';
import { UserOnlineStatus } from '../types';

// tslint:disable-next-line: interface-name
export interface ChatBroadcaster {
  sendChatroomMessage: (chatroomId: string, message: Message) => void;
  sendDirectMessage: (clientIds: string[], message: Message) => void;
  broadcastOnlineStatus: (onlineStatus: UserOnlineStatus) => void;
  broadcastNewChatroom: (chatroom: Chatroom) => void;
  broadcastNewUser: (user: User) => void;
}
