'use strict';

const fs = require('fs');
const express = require('express');
const https = require('https');
const uuid = require('uuid/v4');
const WebSocket = require('ws');
const MongoDB = require('./db/index.js');
const DatabaseUtils = require('./dbUtils/index.js');

const WebSocketServer = WebSocket.Server;

const app = express();

const options = {
  key: fs.readFileSync('../key.pem'),
  cert: fs.readFileSync('../cert.pem'),
  passphrase: 'catMonkey+1106',
};

const server = https
  .createServer(options, app)
  .listen(process.env.PORT || 3000);

const wss = new WebSocketServer({ server });

const clients = [];

function broadcast(ws, message) {
  clients.forEach(client => {
    if (
      client.id !== ws.id &&
      ws.messagesSent > 1 &&
      client.readyState === WebSocket.OPEN
    ) {
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

function addClient(ws) {
  clients.push(ws);
}

function isClient(ws) {
  const client = clients.filter(client => client.id === ws.id);

  return client.length > 0;
}

async function main() {
  await MongoDB.connect();

  const user = await new DatabaseUtils().getUsers();
  console.log('user', user);

  wss.on('connection', ws => {
    if (!isClient(ws)) {
      ws.id = uuid();
      ws.messagesSent = 0;
      addClient(ws);
    }

    ws.on('close', () => {
      removeClient(ws);
      console.log('clients length', clients.length);
    });

    ws.on('message', message => {
      if (!isClient(ws)) {
        throw new Error('Clients socket connection not stored');
      }

      if (ws.messagesSent === 0) {
        ws.name = message;
      }
      console.log('message: ', message);
      ws.messagesSent += 1;
      broadcast(ws, message);
    });
  });
}

main();
