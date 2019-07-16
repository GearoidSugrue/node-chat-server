import { Chatroom, Message, User } from '../../data-store/types';
import {
  ChatroomTypingEvent,
  DirectTypingEvent,
  UserOnlineStatus
} from '../types';

// tslint:disable-next-line: interface-name
export interface ChatBroadcaster {
  sendChatroomMessage: (chatroomId: string, message: Message) => void;
  sendDirectMessage: (clientIds: string[], message: Message) => void;
  broadcastOnlineStatus: (onlineStatus: UserOnlineStatus) => void;
  broadcastChatroomTypingChange: (
    chatroomTypingChange: ChatroomTypingEvent
  ) => void;
  sendDirectTypingChange: (
    clientId: string,
    directTypingChange: DirectTypingEvent
  ) => void;
  broadcastNewChatroom: (chatroom: Chatroom, clientIds: string[]) => void;
  broadcastNewChatroomMember: (chatroomId: string, newUserId: string) => void;
  broadcastNewUser: (user: User) => void;
}
