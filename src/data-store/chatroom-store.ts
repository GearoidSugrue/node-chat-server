import assert from 'assert';
import { Chatroom, Message } from './types';

const dummyMessages = [
  {
    userId: 'zzzzz-zzzzz-zzzzz',
    username: 'Narrator',
    message: `No one would have believed
      in the last years of the 19th century
      that human affairs where being watched
      by intelligences that inhabited the timeless worlds of space.
      No one could have dreamed we were being scrutinized
      as someone with a microscope studies creatures
      that swarm and multiply in a drop of water.
      Few men even considered the possibility of life on other planets
      and yet, across the gulf of space
      minds immeasurably superior to ours
      regarded this Earth with envious eyes,
      and slowly and surely
      they drew their plans against us.`,
    timestamp: '2019-06-06T09:48:00.000Z'
  },
  {
    userId: 'aaaaa-bbbbb-cccc',
    username: 'Winston',
    message:
      'The chances of anything coming from Mars are a million to one! But still they come! ',
    timestamp: '2019-06-07T10:28:00.000Z'
  },
  {
    userId: 'ggggg-hhhhh-iiiiiii',
    username: 'Nathaniel',
    message: `Listen, do you hear them drawing near,
      In their search for the sinners?
      Feeding on the power of our fear,
      And the evil within us.
      Incarnation of Satan's creation of all that we dread,
      When the demons arrive,
      Those alive would be better off dead`,
    timestamp: '2019-06-08T13:48:00.000Z'
  },
  {
    userId: 'aaaaa-bbbbb-cccc',
    username: 'Winston',
    message: `Be a man!... 
      What good is religion if it collapses under calamity? 
      Think of what earthquakes and floods, wars and volcanoes, have done before to men! 
      Did you think that God had exempted us? He is not an insurance agent.`,

    timestamp: '2019-06-10T13:18:00.000Z'
  },
  {
    userId: 'ggggg-hhhhh-iiiiiii',
    username: 'Artilleryman',
    message:
      "This isn't a war. It never was a war, any more than there's war between man and ants.",
    timestamp: '2019-06-11T13:48:00.000Z'
  },
  {
    userId: 'aaaaa-bbbbb-cccc',
    username: 'Winston',
    message: `We'll peck them to death tomorrow dear.`,
    timestamp: '2019-06-11T14:48:00.000Z'
  }
];

type ChatroomPredicate = (chatroom: Chatroom) => boolean;

// holds user and chatroom data. Hard-coded for now but will use some DB in future.
export class ChatroomsStore {
  public readonly chatrooms: { [key: string]: Chatroom };

  constructor() {
    console.log('Initializing Chatrooms Data Store...');

    this.chatrooms = {
      '1111-2222-33333': {
        chatroomId: '1111-2222-33333',
        name: 'new-users!',
        memberIds: ['fiendishly-handsome-fellow'],
        messages: [
          {
            userId: 'fiendishly-handsome-fellow',
            username: 'Gary',
            message: `We'll peck them to death tomorrow dear.`,
            timestamp: '2019-06-05T14:48:00.000Z'
          }
        ]
      },
      '9999-8888-77777': {
        chatroomId: '9999-8888-77777',
        name: 'war-of-the-worlds',
        memberIds: [
          'zzzzz-zzzzz-zzzzz',
          'aaaaa-bbbbb-cccc',
          'ggggg-hhhhh-iiiiiii'
        ],
        messages: dummyMessages
      }
    };
    console.log('Chatrooms Data Store Initialized!');
  }

  public getChatroom(chatroomId: string, requesterUserId: string): Chatroom {
    const chatroom = this.chatrooms[chatroomId] || ({} as Chatroom);
    const isUserMember =
      chatroom.memberIds && chatroom.memberIds.includes(requesterUserId);

    if (!isUserMember) {
      console.log('Unauthorized attempt to view chatroom', {
        chatroomId,
        requesterUserId
      });
      return {} as Chatroom; // todo return or throw Error here instead.
    }
    return chatroom;
  }

  public getChatrooms(): Promise<Chatroom[]> {
    console.log('Getting all users');
    return Promise.resolve(Object.values(this.chatrooms));
  }

  public createChatroom(
    name: string,
    userId: string,
    memberIds = []
  ): Promise<Chatroom> {
    const validChatroom = name && typeof name === 'string';

    if (!validChatroom) {
      console.log('Invalid attempt to create Chatroom', { name });
      // return new Error('Invalid chatroom name');
      return Promise.reject(new Error('Argument Error'));
    }

    const chatroomId = 'todo-generate-chatroomId'; // todo generate uuid here. Or will DB implementation provide it?
    const newChatroom = {
      name,
      chatroomId,
      memberIds: [...new Set([userId, ...memberIds])],
      messages: []
    };
    this.chatrooms[chatroomId] = newChatroom;
    return Promise.resolve(newChatroom);
  }

  public async updateChatroomDetails(
    chatroomId: string,
    updatedDetails: Partial<Chatroom>
  ): Promise<Chatroom> {
    const currentChatroom = this.chatrooms[chatroomId];

    if (!currentChatroom) {
      return Promise.reject(new Error('Argument Error'));
    }

    const updatedChatroom = {
      ...currentChatroom,
      ...updatedDetails,
      chatroomId // since the chatroomId is the chatrooms Map/Object Key I'm preventing it from being changed
    };
    this.chatrooms[chatroomId] = updatedChatroom;
    return updatedChatroom;
  }

  public async addMemberToChatrooms(
    chatroomIds: string[],
    userId: string
  ): Promise<Chatroom[]> {
    if (!chatroomIds || !userId) {
      // Promise.rejects()
      // todo should assertions be done in express layer or business logic
      assert.fail('Invalid userId (path) and/or chatroomIds (body');
    }

    const selectedChatroomsPredicate: ChatroomPredicate = (
      chatroom: Chatroom
    ) => chatroomIds.includes(chatroom.chatroomId);

    const userNotMemberPredicate: ChatroomPredicate = (chatroom: Chatroom) =>
      !chatroom.memberIds.includes(userId);

    const addUserToChatroom = async (chatroom: Chatroom): Promise<Chatroom> => {
      const currentMembersIds = (chatroom && chatroom.memberIds) || [];
      const updatedMembersIds = [...new Set([...currentMembersIds, userId])];

      return this.updateChatroomDetails(chatroom.chatroomId, {
        memberIds: updatedMembersIds
      });
    };

    const updatedChatrooms: Array<Promise<Chatroom>> = Object.values(
      this.chatrooms
    )
      .filter(selectedChatroomsPredicate)
      .filter(userNotMemberPredicate)
      .map(addUserToChatroom);

    return Promise.all(updatedChatrooms);
  }

  /**
   * Adds a message to a chatroom.
   *
   * Returns true if message was successfully added to chatroom.
   * Returns false if it fails.
   *
   * @param chatroomId
   * @param message
   */
  public async addMessageToChatroom(
    chatroomId: string,
    message: Message
  ): Promise<Message> {
    const chatroom = this.chatrooms[chatroomId];

    if (!chatroom) {
      return Promise.reject(new Error('Argument Error'));
    }

    const currentMessages = chatroom.messages || [];
    const updatedMessages = [...currentMessages, message];
    await this.updateChatroomDetails(chatroomId, {
      messages: updatedMessages
    });

    return message;
  }
}
