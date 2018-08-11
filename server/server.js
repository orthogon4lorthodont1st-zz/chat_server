'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('https');
const uuid = require('uuid/v4');
const WebSocket = require('ws');
const MongoDB = require('./db/index.js');
const Routing = require('./routing/actions.js');
const ClientRouting = require('./routing/clientActions.js');
const op = require('./ops');

const key = fs.readFileSync(path.join(__dirname, '../key.pem'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, '../cert.pem'), 'utf8');

const creds = {
  key,
  cert,
};

const PORT = process.env.PORT || 3000;

const app = express();

const server = https.createServer(creds, app).listen(PORT);

const wss = new WebSocket.Server({ server });

const clients = [];

function broadcast(currentClient, message) {
  clients.forEach(client => {
    if (
      client.id !== currentClient.id &&
      currentClient.messagesSent > 0 &&
      client.readyState === WebSocket.OPEN
    ) {
      const encodedMessage = encodeClientMessage(
        `${currentClient.name}: ${message}`,
      );
      client.send(encodedMessage);
    }
  });
}

Array.prototype.remove = function(data) {
  for (let i = 0; i < this.length; i++) {
    if (data === this[i]) {
      this.splice(i, 1);
    }
  }
};

function usernameIsTaken(username) {
  for (let i = 0; i < clients.length; i++) {
    if (username === clients[i].username) {
      return true;
    }
  }
  return false;
}

function isCommand(message) {
  return message.split('')[0] === '/' && message.length > 1;
}

function encodeErrorMessage(data) {
  return Buffer.from(`error|${data}`).toString('base64');
}

function encodeSystemMessage(data) {
  return Buffer.from(`system|${data}`).toString('base64');
}

function encodeClientMessage(data) {
  return Buffer.from(`client|${data}`).toString('base64');
}

function addClient(ws) {
  clients.push(ws);
}

async function main() {
  await MongoDB.connect();

  wss.on('connection', client => {
    if (!clients.includes(client)) {
      client.id = uuid();
      client.messagesSent = 0;
      addClient(client);
    }

    client.on('close', async () => {
      clients.remove(client);
      await Routing.route(op.deleteUser, { username: client.username });
    });

    client.on('message', async message => {
      if (client.messagesSent === 0 && usernameIsTaken(message)) {
        return client.send(encodeErrorMessage('Username is taken'));
      }

      if (client.messagesSent === 0) {
        client.username = message;
        client.messagesSent += 1;
        return Routing.route(op.createUser, { username: message });
      }

      if (isCommand(message)) {
        const command = op.getCommand(message);

        if (!command) {
          return client.send(encodeErrorMessage('Command not supported'));
        }

        let data = await ClientRouting.route(command, {});

        data = data.map(user => user.username);
        data = encodeSystemMessage(data);
        return client.send(data);
      }
      broadcast(client, message);
    });
  });
}

main();

// server.listen(3000);
