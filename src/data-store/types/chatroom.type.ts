import { Message } from './message.type';

export type Chatroom = Readonly<{
  chatroomId: string;
  name: string;
  memberIds: string[]; // todo rename memberUserIds?
  messages: Message[];
}>;
