export type Message = Readonly<{
  userId: string;
  username: string; // todo this has been super-seeded by userId. The UI could use userId to get the username. Leaving here for now tho.
  message: string;
  timestamp: string;
  toUserId?: string;
  chatroomId?: string;
}>;
