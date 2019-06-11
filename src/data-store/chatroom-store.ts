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
      they drew their plans against us.`
  },
  {
    userId: 'aaaaa-bbbbb-cccc',
    username: 'Winston',
    message:
      'The chances of anything coming from Mars are a million to one! But still they come! '
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
      Those alive would be better off dead`
  },
  {
    userId: 'aaaaa-bbbbb-cccc',
    username: 'Winston',
    message: `Be a man!... 
      What good is religion if it collapses under calamity? 
      Think of what earthquakes and floods, wars and volcanoes, have done before to men! 
      Did you think that God had exempted us? He is not an insurance agent.`
  },
  {
    userId: 'ggggg-hhhhh-iiiiiii',
    username: 'Artilleryman',
    message:
      "This isn't a war. It never was a war, any more than there's war between man and ants."
  },
  {
    userId: 'aaaaa-bbbbb-cccc',
    username: 'Winston',
    message: `We'll peck them to death tomorrow dear.`
  }
];

// holds user and chatroom data. Hard-coded for now but will use some DB in future.
export class ChatroomsStore {
  public readonly chatrooms: { [key: string]: Chatroom };

  constructor() {
    console.log('Initializing Chatrooms Data Store...');

    this.chatrooms = {
      '1111-2222-33333': {
        chatroomId: '1111-2222-33333',
        name: 'New Users Chat!',
        memberIds: ['fiendishly-handsome-fellow'],
        messages: [
          {
            userId: 'fiendishly-handsome-fellow',
            username: 'Gary',
            message: `We'll peck them to death tomorrow dear.`
          }
        ]
      },
      '9999-8888-77777': {
        chatroomId: '9999-8888-77777',
        name: 'War of the Worlds Discussion',
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

  public getChatroom(chatroomId: string): Chatroom {
    return this.chatrooms[chatroomId] || ({} as Chatroom);
  }

  public getChatrooms(): Chatroom[] {
    console.log('Getting all users');
    return Object.values(this.chatrooms);
  }

  public getChatroomMessages(
    chatroomId: string,
    requesterUserId: string
  ): Message[] {
    const chatroom = this.getChatroom(chatroomId);
    const isUserMember =
      chatroom &&
      chatroom.memberIds &&
      chatroom.memberIds.includes(requesterUserId);

    if (!isUserMember) {
      console.log('Unauthorized attempt to view chatroom messages', {
        chatroomId,
        requesterUserId
      });
      return [];
    }
    const messages = chatroom.messages || [];

    // todo delete me! Using this to test React hook is updating correctly
    const testData: Message[] = [
      {
        userId: 'fiendishly-handsome-fellow',
        username: 'Gary',
        message: `Test message in chatroom: ${chatroomId}  -  ${Math.random() *
          100000000}`
      }
    ];
    return [...messages, ...testData];
  }

  public addChatroom(name: string): Chatroom {
    const validChatroom = name && typeof name === 'string';

    if (!validChatroom) {
      console.log('Invalid attempt to create Chatroom', { name });
      return;
    }

    const chatroomId = 'todo-generate-chatroomId'; // todo generate uuid here
    this.chatrooms[chatroomId] = {
      name,
      chatroomId,
      memberIds: [], // todo add userId of creator here?
      messages: [] // todo add default user create message here?
    };
    return this.chatrooms[chatroomId];
  }

  public updateChatroomDetails(
    chatroomId: string,
    updatedDetails: Partial<Chatroom>
  ): Chatroom {
    const currentDetails = this.chatrooms[chatroomId];
    const updatedChatroom = {
      ...currentDetails,
      ...updatedDetails,
      chatroomId // since the chatroomId is the chatrooms Map/Object Key I'm preventing it from being changed
    };
    this.chatrooms[chatroomId] = updatedChatroom;
    return updatedChatroom;
  }

  public addMemberToChatroom(chatroomId: string, userId: string): void {
    const currentMembersIds = this.getChatroom(chatroomId).memberIds || [];
    const updatedMembersIds = [...currentMembersIds, userId];
    this.updateChatroomDetails(chatroomId, { memberIds: updatedMembersIds });
  }

  public addMessageToChatroom(chatroomId: string, message: Message): void {
    const currentMessages = this.getChatroom(chatroomId).messages || [];
    const updatedMessages = [...currentMessages, message];
    this.updateChatroomDetails(chatroomId, { messages: updatedMessages });
  }
}
