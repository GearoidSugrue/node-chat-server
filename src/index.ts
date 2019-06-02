import cors from 'cors';
import express from 'express';
import http from 'http';
import socket from 'socket.io';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socket(server);

const PORT = 3001;

// todo is it worth using rxjs Subjects?
const users = {
  // dummy users to test react-chat-app functionality. Delete later.
  Winston: {
    username: 'Winston',
    online: false,
    clientId: null
  },
  Tracer: {
    username: 'Tracer',
    online: true,
    clientId: '123-456-789'
  }
};

const clientUsernames = {
  // todo delete test data
  '123-456-789': 'Tracer'
};

// socket auto deletes empty rooms so to persist chatrooms after all users have left we need to keep track manually
const rooms = new Set(['Test Room', 'Another Test Room']); // todo delete test data

const chatroomExists = chatroom => rooms.has(chatroom);
const userExists = username => Boolean(users[username]);

app.get('/users', (req, res) => res.send(Object.values(users)));
app.get('/rooms', (req, res) => res.send([...rooms.values()]));

app.get('/rooms/:chatroom/messages', (req, res) => {
  const chatroom = req.params.chatroom;

  console.log('GET chatroom messages:', chatroom);

  const roomDummyData = [
    {
      username: 'Gary',
      message: `Chatroom: ${chatroom}  -  ${Math.random() * 100000}`
    },
    {
      username: 'Winston',
      message:
        'This is ROOM temp data until I decide how to do this properly...'
    },
    {
      username: 'Tracer',
      message: "I'll do it after the react-app is in better shape!"
    }
  ];

  res.send(roomDummyData);
});

app.get('/users/:username/messages', (req, res) => {
  const username = req.params.username;
  const requesterUsername = req.header('RequesterUsername'); // todo the username of the user making the request should be gotten from a token or using equivalent security measures

  console.log('GET user messages:', {
    username,
    requesterUsername,
    req: req.params
  });

  const userDummyData = [
    { username, message: `Hello!  -   ${Math.random() * 100000}` },
    {
      username,
      message: 'This is test USER data!'
    }
  ];

  res.send(userDummyData);
});

app.post('/room/:chatroom', (req, res) => {
  const chatroom = req.params.chatroom;
  rooms.add(chatroom);

  // todo make rooms$ so the below can be removed
  /* class Socket {
      constructor (chatData) {
        this.roomsSubscription = chatData.rooms$.subscribe(rooms => this.broadcastRoomsUpdates)
      }
  }*/
  io.emit('rooms updated', [...rooms.values()]);
});

// ===============================================

const broadcastUserOnlineStatus = ({ username, online }) => {
  console.log('User online status change', { username, online });
  io.emit('online status change', { username, online });

  // ChatData -> updateUserOnlineStatus({ username, online}) { ...  } hmm?
};

// todo investigate rxjs/from. See if it cleans up the code.

const logoutUser = username => {
  if (userExists(username)) {
    users[username].online = false;
    users[username].clientId = undefined;
    console.log(`${username} has logged out`);

    broadcastUserOnlineStatus({ username, online: false });
  }
};

const logoutUserByClientId = clientId => {
  const username = clientUsernames[clientId];

  if (username) {
    delete clientUsernames[username];
    logoutUser(username);
  }
};

io.on('connection', client => {
  console.log('User connected:', client.id);

  client.on('disconnect', reason => {
    console.log(`Client ${client.id} disconnected:`, reason);
    logoutUserByClientId(client.id);
  });

  // using login for both login and creating users for now. Will split it out later. Probably make it a POST.
  client.on('login', ({ username }) => {
    if (!username) {
      console.warn('Invalid login attempt');
      return;
    }
    clientUsernames[client.id] = username;

    users[username] = {
      username,
      online: true,
      clientId: client.id
    };
    console.log(`${username} has logged in`);
    broadcastUserOnlineStatus({ username, online: true });
  });

  client.on('logout', () => logoutUserByClientId(client.id));

  /* fromEvent(client, 'create chatroom')
      .pipe(
        .filter(invalidChatroom) // validChatroom
        .filter(invalidUsername)
        .map(({ chatroom, username }) => {              // .map(createChatroom)   
          rooms.add(chatroom);
          client.join(chatroom);

          // broadcastRoomsUpdate({ username ...}) or rooms$.next(updatedRooms) then somewhere: rooms$.subscribe(broadcastRoomsUpdated)
          io
            .to(chatroom)
            .emit('message', {
              username,
              message: `${username} has created the chat!`
            });
          console.log(`${username} created chatroom ${chatroom}`);
        })     
      )
  */

  client.on('create chatroom', ({ chatroom, username }) => {
    if (!chatroom || !username) {
      console.warn('Invalid attempt to create chatroom:', {
        chatroom,
        username
      });
      return undefined;
    }

    rooms.add(chatroom);
    client.join(chatroom);
    io.to(chatroom).emit('message', {
      username,
      message: `${username} has created the chat!`
    });
    console.log(`${username} created chatroom ${chatroom}`);
  });

  client.on('join chatroom', ({ chatroom, username }) => {
    const invalidJoinAttempt =
      !chatroomExists(chatroom) || !userExists(username);

    if (invalidJoinAttempt) {
      console.warn(`Invalid attempt to join chatroom:`, { chatroom, username });
      return undefined;
    }

    client.join(chatroom);
    io.to(chatroom).emit('message', {
      username,
      message: `${username} has joined the chat!`
    });
    console.log(`${username} has joined chatroom ${chatroom}`);
  });

  client.on('leave chatroom', ({ chatroom, username }) => {
    const invalidLeaveAttempt =
      !chatroomExists(chatroom) || !userExists(username);

    if (invalidLeaveAttempt) {
      console.warn(`Invalid attempt to leave chatroom:`, {
        chatroom,
        username
      });
      return undefined;
    }

    client.broadcast // todo check if this should be io instead of client
      .to(chatroom)
      .emit('message', {
        username,
        message: `${username} has left the chat! ಠ_ಠ`
      });
    client.leave(chatroom);
    console.log(`${username} has left chatroom: ${chatroom}`);
  });

  client.on('new message to chatroom', ({ chatroom, username, message }) => {
    const invalidMessageAttempt =
      !chatroomExists(chatroom) || !userExists(username);

    if (invalidMessageAttempt) {
      console.warn(`Invalid attempt to message chatroom:`, {
        chatroom,
        username,
        message
      });
      return undefined;
    }

    io.to(chatroom).emit('message', {
      username,
      message
    });
    console.log(`${username} messaged chatroom ${chatroom}: ${message}`);
  });

  client.on('new message to user', ({ toUsername, username, message }) => {
    const user = users[toUsername];
    const invalidMessageAttempt = !toUsername || !user;

    if (invalidMessageAttempt) {
      console.warn(`Invalid attempt to message user`, {
        toUsername,
        username,
        message
      });
      return undefined;
    }
    const clientId = user.clientId; // todo may need to null check this as it will be undefined if the user if not logged in

    client.to(clientId).emit('message', {
      username,
      message
    });
    console.log(`${username} messaged user ${toUsername}: ${message}`);
  });
});

server.listen(PORT, () => console.log(`Chat server started on port ${PORT}`));
