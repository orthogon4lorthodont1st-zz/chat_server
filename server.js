'use strict';

const express = require('express');
const uuid = require('uuid/v4');
const SocketServer = require('ws').Server;

const PORT = process.env.PORT || 3000;

const clients = [];

const server = express().listen(PORT, () =>
  console.log(`Listening on port: ${PORT}`),
);

const wss = new SocketServer({ server });

wss.on('connection', ws => {
  if (!isClient(ws)) {
    ws.id = uuid();
    ws.messagesSent = 0;
    clients.push(ws);
  }

  ws.on('close', () => {
    removeClient(ws);
  });

  ws.on('message', message => {
    console.log('num', clients.length);
    if (!isClient(ws)) {
      throw new Error('Clients socket connection not stored');
    }
    if (ws.messagesSent === 0) {
      ws.name = message;
    }

    ws.messagesSent += 1;
    broadcast(ws, message);
  });
});

function broadcast(ws, message) {
  console.log('clients leng', clients.length);
  clients.forEach(client => {
    if (client.id !== ws.id && ws.messagesSent > 1) {
      client.send(`${ws.name}: ${message}`);
    }
  });
}

function removeClient(ws) {
  const myClient = clients.filter(client => client.id === ws.id)[0];
  const index = clients.indexOf(myClient);

  if (index > -1) {
    clients.splice(index, 1);
  }
}

function isClient(ws) {
  const client = clients.filter(client => client.id === ws.id);

  return client.length > 0;
}
