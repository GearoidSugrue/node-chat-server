// export type ChatroomTypingEvent = Readonly<{
//   typing: boolean;
//   toChatroomId: string;
// }>;

// // tslint:disable-next-line: interface-name
// export interface ChatroomTypingChangeEvent extends ChatroomTypingEvent {
//   userId: string;
//   username: string;
// }

// // ---

type TypingChange = Readonly<{
  typing: boolean;
  userId: string;
  username: string;
}>;

// tslint:disable-next-line: interface-name
export interface DirectTypingEvent extends TypingChange {
  toUserId: string;
}

// tslint:disable-next-line: interface-name
export interface ChatroomTypingEvent extends TypingChange {
  toChatroomId: string;
}
