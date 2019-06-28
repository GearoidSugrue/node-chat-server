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
