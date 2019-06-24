import assert from 'assert';
import { Message, User } from './types';

const dummyUsers: { [key: string]: User } = {
  'zzzzz-zzzzz-zzzzz': {
    userId: 'zzzzz-zzzzz-zzzzz',
    username: 'Narrator',
    chatroomIds: ['9999-8888-77777'],
    online: false,
    messages: {}
  },
  'aaaaa-bbbbb-cccc': {
    userId: 'aaaaa-bbbbb-cccc',
    username: 'Winston',
    chatroomIds: ['9999-8888-77777'],
    online: false,
    messages: {
      'ddddd-eeeee-fffff': [
        {
          userId: 'ddddd-eeeee-fffff',
          username: 'Nathaniel',
          message: 'Hello!',
          timestamp: '2019-06-11T13:48:00.000Z'
        }
      ]
    }
  },
  'ddddd-eeeee-fffff': {
    userId: 'ddddd-eeeee-fffff',
    username: 'Nathaniel',
    chatroomIds: ['9999-8888-77777'],
    online: true,
    messages: {}
  },
  'ggggg-hhhhh-iiiiiii': {
    userId: 'ggggg-hhhhh-iiiiiii',
    username: 'Artilleryman',
    chatroomIds: ['9999-8888-77777'],
    online: false,
    messages: {}
  },
  'fiendishly-handsome-fellow': {
    userId: 'fiendishly-handsome-fellow',
    username: 'Gary the Great',
    chatroomIds: ['1111-2222-33333', '9999-8888-77777'],
    online: false,
    messages: {}
  }
};

// holds user and chatroom data. Hard-coded for now but will use some DB in future.
export class UsersStore {
  public readonly users: { [key: string]: User };

  constructor() {
    console.log('Initializing Users Data Store...');
    this.users = dummyUsers;
    console.log('Users Data Store Initialized!');
  }

  public async getUser(userId: string): Promise<User> {
    return this.users[userId] || ({} as User);
  }

  public async getUserMessages(
    userId: string,
    requestingUserId: string
  ): Promise<Message[]> {
    const user = await this.getUser(userId);

    if (!user || !requestingUserId) {
      console.log('Invalid attempt to get user messages', {
        userId,
        requestingUserId
      });
      return [];
    }

    const userMessages = user.messages || {};
    return userMessages[requestingUserId] || [];
  }

  public async getUsers(): Promise<User[]> {
    console.log('Getting all users');
    return Object.values(this.users);
  }

  public addUser(username: string): User {
    const validUser = username && typeof username === 'string';

    if (!validUser) {
      console.log('Invalid attempt to create User', { username });
      return;
    }

    const userId = 'todo-generate-uuid';
    this.users[userId] = {
      userId,
      username,
      chatroomIds: [],
      messages: {}
    };
    return this.users[userId];
  }

  /**
   * Adds a message to the specified user.
   * Returns true if successful. False if failure.
   *
   * @param userId recipient user's userId
   * @param fromUserId sender's userId
   * @param message the message to add
   */
  public addMessageToUser(
    userId: string,
    fromUserId: string,
    message: Message
  ): boolean {
    const toUser = userId && this.users[userId];
    const fromUser = fromUserId && this.users[fromUserId];

    if (toUser && fromUser) {
      const currentUserMessages = toUser.messages[fromUserId] || [];
      const updatedUserMessages = [...currentUserMessages, message];
      this.users[userId].messages[fromUserId] = updatedUserMessages;
      return true;
    }
    console.log('Invalid attempt to add user message:', {
      userId,
      fromUserId,
      message
    });
    return false;
  }

  public async addUserToChatrooms(
    userId: string,
    chatroomIds: string[]
  ): Promise<User> {
    if (!userId || !chatroomIds) {
      // Promise.rejects()
      // todo should assertions be done in express layer or business logic
      assert.fail('Invalid userId and/or chatroomIds');
    }

    const user: User = await this.getUser(userId);

    const currentChatroomIds = (user && user.chatroomIds) || [];
    const updatedChatroomIds: string[] = [
      ...new Set([...currentChatroomIds, ...chatroomIds])
    ];
    return this.updateUserDetails(user.userId, {
      chatroomIds: updatedChatroomIds
    });
  }

  public updateUserDetails(
    userId: string,
    updatedDetails: Partial<User>
  ): User {
    const currentDetails = this.users[userId];
    const updatedUser = {
      ...currentDetails,
      ...updatedDetails,
      userId // since the userId is the users Map/Object Key I'm preventing it from being changed
    };
    this.users[userId] = updatedUser;
    return updatedUser;
  }
}
