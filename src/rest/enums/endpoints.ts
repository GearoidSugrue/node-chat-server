import { PathParam } from './path-param.enum';

enum Endpoint {
  chatrooms = 'chatrooms',
  chatroom = 'chatroom',
  chatroomMessages = 'chatroomMessages',
  users = 'users',
  userMessages = 'userMessages',
  userChatrooms = 'userChatrooms'
}

// using a dictionary instead of enums as enums can't contain computed values. e.g. `/rooms/:${PathParam.chatroomId}/messages
export const endpoints: Readonly<{ [key in Endpoint]: string }> = {
  [Endpoint.chatrooms]: '/rooms',
  [Endpoint.chatroom]: `/rooms/:${PathParam.chatroomId}`,
  [Endpoint.chatroomMessages]: `/rooms/:${PathParam.chatroomId}/messages`,
  [Endpoint.users]: '/users',
  [Endpoint.userMessages]: `/users/:${PathParam.userId}/messages`,
  [Endpoint.userChatrooms]: `/users/:${PathParam.userId}/rooms`
};
