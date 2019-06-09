import { Message } from './message.type';

/*
 * The advantages of types over interfaces is that its easier to set all properties readonly.
 * Also, it allows interfaces to use exclusively for classes implementing them
 * and types used exclusively for typing things. Interfaces as types are awkward in IMO.
 */
export type User = Readonly<{
  userId: string;
  username: string;
  messages: { [key: string]: Message[] }; // I'll probably store messages some else when a DB is integrated
  chatroomIds: string[];
  online?: boolean; // todo maybe this could also be moved out? Maybe after graphql implementation
  clientId?: string; // todo find a more suitable place for this property
}>;
