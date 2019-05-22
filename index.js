const cors = require('cors');
const app = require('express')();
app.use(cors());

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = 3001;

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

let clientUsernames = {
  // todo delete test data
  '123-456-789': 'Tracer'
}

// socket auto deletes empty rooms so to persist chatrooms after all users have left we need to keep track manually
const rooms = new Set(['Test Room', 'Another Test Room']); // todo delete test data

const chatroomExists = chatroom => rooms.has(chatroom);
const userExists = username => Boolean(users[username]);

app.get('/users', (req, res) => res.send(Object.values(users)));
app.get('/rooms', (req, res) => res.send([...rooms.values()]));

// todo investigate rxjs/from. See if it cleans up the code. 

const logoutUser = (username) => {

  if (userExists(username)) {
    users[username].online = false;
    users[username].clientId = undefined;
    console.log(`${username} has logged out`);
  }
}

const logoutUserByClientId = (clientId) => {
  const username = clientUsernames[clientId];

  if (username) {
    delete clientUsernames[username];
    logoutUser(username);
  }
}

io.on('connection', client => {
  console.log('User connected:', client.id);

  client.on('disconnect', reason => {
    console.log(`Client ${client.id} disconnected:`, reason);
    logoutUserByClientId(client.id);
  });


  // using login for both login and creating users for now. Will split it out later. Probably make it a POST.
  client.on('login', ({ username }) => {
    if (!username) {
      console.warn('Invalid login attempt')
      return;
    }
    clientUsernames[client.id] = username;

    users[username] = {
      username,
      online: true,
      clientId: client.id
    };
    console.log(`${username} has logged in`)
  })

  client.on('logout', () => logoutUserByClientId(client.id))

  client.on('create chatroom', ({ chatroom, username }) => {

    if (!chatroom || !username) {
      console.warn('Invalid attempt to create chatroom:', { chatroom, username });
      return undefined;
    }

    rooms.add(chatroom);
    client.join(chatroom);
    io
      .to(chatroom)
      .emit('message', {
        username,
        message: `${username} has created the chat!`
      });
    console.log(`${username} created chatroom ${chatroom}`);
  });

  client.on('join chatroom', ({ chatroom, username }) => {
    const invalidJoinAttempt = !chatroomExists(chatroom) || !userExists(username);

    if (invalidJoinAttempt) {
      console.warn(`Invalid attempt to join chatroom:`, { chatroom, username })
      return undefined;
    }

    client.join(chatroom);
    io
      .to(chatroom)
      .emit('message', {
        username,
        message: `${username} has joined the chat!`
      });
    console.log(`${username} has joined chatroom ${chatroom}`);
  });

  client.on('leave chatroom', ({ chatroom, username }) => {
    const invalidLeaveAttempt = !chatroomExists(chatroom) || !userExists(username);

    if (invalidLeaveAttempt) {
      console.warn(`Invalid attempt to leave chatroom:`, { chatroom, username })
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
    const invalidMessageAttempt = !chatroomExists(chatroom) || !userExists(username);

    if (invalidMessageAttempt) {
      console.warn(`Invalid attempt to message chatroom:`, { chatroom, username, message })
      return undefined;
    }

    client.broadcast
      .to(chatroom)
      .emit('message', {
        username,
        message
      });
    console.log(`${username} messaged chatroom ${chatroom}: ${message}`);
  });

  client.on('new message to user', ({ toUsername, username, message }) => {
    const user = user[toUsername];
    const invalidMessageAttempt = !toUsername || !user;

    if (invalidMessageAttempt) {
      console.warn(`Invalid attempt to message user`, { toUsername, username, message })
      return undefined;

    }
    const clientId = user.clientId; // todo may need to null check this as it will be undefined if the user if not logged in

    client.broadcast
      .to(clientId)
      .emit('message', {
        username,
        message
      });
    console.log(`${username} messaged user ${toUsername}: ${message}`);
  });
});

server.listen(PORT, () => console.log(`Chat server started on port ${PORT}`));
