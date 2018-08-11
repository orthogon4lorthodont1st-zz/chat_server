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

function encodeErrorMessage(data) {
  return Buffer.from(`error|${data}`).toString('base64');
}

function encodeSystemMessage(data) {
  return Buffer.from(`system|${data}`).toString('base64');
}

function encodeClientMessage(data) {
  return Buffer.from(`client|${data}`).toString('base64');
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

  wss.on('connection', client => {
    if (!isClient(client)) {
      client.id = uuid();
      client.messagesSent = 0;
      addClient(client);
    }

    client.on('close', async () => {
      removeClient(client);
      // await Routing.route(op.deleteUser, { username: client.username });
    });

    client.on('message', async message => {
      if (!isClient(client)) {
        throw new Error('Clients socket connection not stored');
      }

      if (client.messagesSent === 0) {
        await Routing.route(op.createUser, { username: message });
        client.name = message;
        client.messagesSent += 1;
        return;
      }

      if (message.split('')[0] === '/' && message.length > 1) {
        const command = op.getOperation(message);

        if (!command) {
          const errorMessage = encodeErrorMessage('Command not supported');
          return client.send(errorMessage);
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
