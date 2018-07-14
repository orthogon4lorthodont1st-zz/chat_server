const { createServer } = require('net');

const server = createServer();

let numConnected = 0;
const sockets = {};
process.stdout.setEncoding('utf8');

function broadcast(socket, message) {
  process.stdout('bc');
  Object.entries(sockets).forEach(([key, currSock]) => {
    if (parseFloat(key) !== socket.id) {
      currSock.write(message);
    }
  });
}

function addSocket(socket, data) {
  socket.name = data.toString().trim();
  sockets[socket.id] = socket;
}

server.on('connection', socket => {
  numConnected += 1;
  socket.id = numConnected;

  socket.on('data', data => {
    process.stdout.write(data);
    if (!sockets[socket.id]) {
      process.stdout.write('inside ifnot \n');
      addSocket(socket, data);
      return;
    }

    const message = `${socket.name}: ${data} `;
    broadcast(socket, message);
  });

  socket.on('end', () => {
    delete sockets[socket.id];

    const message = `${socket.name}: has left`;
    broadcast(socket, message);
  });
});

server.listen(3000, () => {
  process.stdout.write('Server has started \n');
});
