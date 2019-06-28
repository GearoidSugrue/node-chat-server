export type UserTypingEvent = Readonly<{
  typing: boolean;
  toUserId: string;
}>;

// tslint:disable-next-line: interface-name
export interface UserTypingChangeEvent extends UserTypingEvent {
  userId: string;
}
