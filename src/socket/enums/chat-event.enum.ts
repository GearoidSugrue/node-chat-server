export enum ChatEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ONLINE_STATUS_CHANGE = 'online status change',
  MESSAGE_CHATROOM = 'new message to chatroom',
  MESSAGE_USER = 'new message to user',
  NEW_USER = 'users updated', // todo rename when implemented on front-end
  NEW_CHATROOM = 'rooms updated' // todo rename when implemented on front-end
}
