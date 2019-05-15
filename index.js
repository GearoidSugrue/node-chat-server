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

const rooms = []; // socket auto deletes empty rooms so to persist chatrooms after all users have left we need to keep track manually

app.get('/users', (req, res) => res.send(Object.values(users)));
// todo add GET /rooms

// todo investigate rxjs/from. See if it cleans up the code.

const logoutUser = (username) => {
  const userExists = users[username];

  if (userExists) {
    users[username].online = false;
    users[username].clientId = undefined;
  }
}

const logoutUserByClientId = (clientId) => {
  const username = clientUsernames[clientId];

  if (username) {
    delete clientUsernames[username]

    logoutUser(username);
  }
}

io.on('connection', client => {
  console.log('User connected:', client.id);

  client.on('disconnect', reason => {
    console.log(`Client ${client.id} disconnected:`, reason);
    logoutUserByClientId(client.id);
  });

  client.on('login', ({ username }) => {
    if (!username) {
      return;
    }
    console.log(`${username} has logged in`)

    clientUsernames[client.id] = username;
    const userExists = Boolean(users[username]);

    if (userExists) {
      users[username].online = false
    } else {
      users[username] = {
        username,
        online: true,
        clientId: client.id
      }
    }
  })

  client.on('logout', () => {
    console.log(`${clientId} has logged out`)
    logoutUserByClientId(client.id);
  });

  client.on('create chatroom', ({ chatroom, username }) => {
    console.log(`${username} creating chatroom ${chatroom}`);

    rooms.append(chatroom)
    client.join(chatroom);
    io
      .to(chatroom)
      .emit('message', {
        username,
        message: `${username} has created the chat!`
      });
  });

  client.on('join chatroom', ({ chatroom, username }) => {
    console.log(`${username} joining chatroom ${chatroom}`);

    client.join(chatroom);
    io
      .to(chatroom)
      .emit('message', {
        username,
        message: `${username} has joined the chat!`
      });

    const allSocketRooms = Object.keys(io.sockets.adapter.rooms);
    const allSocketUserIds = Object.keys(io.sockets.adapter.sids);

    const chatroomPredicate = room => !allSocketUserIds.includes(room);
    const chatrooms = allSocketRooms.filter(chatroomPredicate);

    console.log('chatrooms', chatrooms);
    // todo finish this!
  });

  client.on('leave chatroom', ({ chatroom, username }) => {
    console.log(`${username} leaving chatroom ${chatroom}`);

    client.broadcast
      .to(chatroom)
      .emit('message', {
        username,
        message: `${username} has left the chat! ಠ_ಠ`
      });
    client.leave(chatroom);
  });


  client.on('new message to chatroom', ({ chatroom, username, message }) => {
    console.log(`${username} to chatroom ${chatroom}: ${message}`);

    client.broadcast
      .to(chatroom)
      .emit('message', {
        username,
        message
      });
  });

  client.on('new message to user', ({ toUsername, username, message }) => {
    console.log(`${username} to user ${toUsername}: ${message}`);

    const user = user[toUsername];
    const clientId = user && user.clientId;

    client.broadcast
      .to(clientId)
      .emit('message', {
        username,
        message
      });
  });
});

server.listen(PORT, () => console.log(`Chat server started on port ${PORT}!`));
