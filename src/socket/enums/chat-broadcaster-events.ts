export enum ChatBroadcasterEvent {
  ONLINE_STATUS_CHANGE = 'online status change',
  NEW_USER = 'users updated', // todo rename when implemented on front-end
  NEW_CHATROOM = 'new chatroom',
  NEW_CHATROOM_MEMBER = 'new chatroom member',
  CHATROOM_TYPING_CHANGE = 'typing in chatroom change',
  DIRECT_TYPING_CHANGE = 'direct typing change'
}
