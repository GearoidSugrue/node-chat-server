import assert from 'assert';
import uuidv4 from 'uuid/v4';

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
    assert.ok(Boolean(userId), "argument 'userId' is missing");

    const user: User = this.users[userId];

    if (!user) {
      const error = new Error('User Not Found');
      error.name = 'Argument Error';
      throw error;
    }
    return user;
  }

  public async getUserMessages(
    userId: string,
    requestingUserId: string
  ): Promise<Message[]> {
    assert.ok(Boolean(userId), "argument 'userId' is missing");
    assert.ok(
      Boolean(requestingUserId),
      "argument 'requestingUserId' is missing"
    );

    const user = await this.getUser(userId);

    const userMessages = user.messages || {};
    return userMessages[requestingUserId] || [];
  }

  public async getUsers(): Promise<User[]> {
    console.log('Getting all users');
    return Object.values(this.users);
  }

  public async addUser(username: string): Promise<User> {
    assert.ok(Boolean(username), "argument 'username' is missing");
    assert.strictEqual(
      typeof username,
      'string',
      "argument 'username' must be a string"
    );

    const userId = uuidv4();
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
  public async addMessageToUser(
    userId: string,
    fromUserId: string,
    message: Message
  ): Promise<Message> {
    // throw new Error('blah!');

    assert.ok(Boolean(userId), "argument 'userId' is missing");
    assert.ok(Boolean(fromUserId), "argument 'fromUserId' is missing");
    assert.ok(Boolean(message), "argument 'message' is missing");

    const [toUser, fromUser] = await Promise.all([
      this.getUser(userId),
      this.getUser(fromUserId)
    ]);

    const currentUserMessages = toUser.messages[fromUser.userId] || [];
    const updatedUserMessages = [...currentUserMessages, message];

    this.users[userId].messages[fromUser.userId] = updatedUserMessages;
    return message;
  }

  public async addUserToChatrooms(
    userId: string,
    chatroomIds: string[]
  ): Promise<Partial<User>> {
    assert.ok(Boolean(userId), "argument 'userId' is missing");
    assert.ok(Boolean(chatroomIds), "argument 'chatroomIds' is missing");

    const user: User = await this.getUser(userId);

    const currentChatroomIds = user.chatroomIds || [];
    const updatedChatroomIds: string[] = [
      ...new Set([...currentChatroomIds, ...chatroomIds])
    ];
    return this.updateUserDetails(user.userId, {
      chatroomIds: updatedChatroomIds
    });
  }

  public async updateUserDetails(
    userId: string,
    updatedUserDetails: Partial<User>
  ): Promise<Partial<User>> {
    assert.ok(Boolean(userId), "argument 'userId' is missing");
    assert.ok(
      Boolean(updatedUserDetails),
      "argument 'updatedUserDetails' is missing"
    );

    const currentUserDetails: User = await this.getUser(userId);
    const updatedUser = {
      ...currentUserDetails,
      ...updatedUserDetails,
      userId // since the userId is the users Map/Object Key I'm preventing it from being changed
    };
    this.users[userId] = updatedUser;

    return {
      ...updatedUserDetails,
      userId
    };
  }
}
