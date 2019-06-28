export enum ChatEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  LOGIN = 'login',
  LOGOUT = 'logout',
  MESSAGE_CHATROOM = 'new message to chatroom',
  MESSAGE_USER = 'new message to user',
  CHATROOM_TYPING = 'typing in chatroom',
  DIRECT_TYPING = 'typing direct'
}
