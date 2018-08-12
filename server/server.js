'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const uuid = require('uuid/v4');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const MongoDB = require('./db/index.js');
const Routing = require('./routing/actions.js');
const ClientRouting = require('./routing/clientCommands.js');
const op = require('./opNames');
const routes = require('./routing/httpRoutes.js');

const key = fs.readFileSync(path.join(__dirname, '../key.pem'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, '../cert.pem'), 'utf8');

const creds = {
  key,
  cert,
};

const PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/v1', routes);

const server = https.createServer(creds, app);

const wss = new WebSocket.Server({ server });

const clients = [];

Array.prototype.remove = function(data) {
  for (let i = 0; i < this.length; i++) {
    if (data === this[i]) {
      this.splice(i, 1);
    }
  }
};

function broadcast(currentClient, message) {
  clients.forEach(client => {
    if (
      client.isValid === true &&
      client.id !== currentClient.id &&
      currentClient.messagesSent > 0 &&
      client.readyState === WebSocket.OPEN
    ) {
      client.send(
        JSON.stringify({
          type: 'clientMessage',
          username: currentClient.username,
          message,
        }),
      );
    }
  });
}

function isCommand(message) {
  return message.split('')[0] === '/' && message.length > 1;
}

async function main() {
  await MongoDB.connect();

  wss.on('connection', (client, req) => {
    if (!clients.includes(client)) {
      client.id = uuid();
      client.messagesSent = 0;
      clients.push(client);
    }

    client.on('close', async () => {
      clients.remove(client);
      console.log('client', client.username);
      await Routing.route(op.deleteUser, client.username);
    });

    client.on('message', async data => {
      data = JSON.parse(data);
      if (client.messagesSent === 0) {
        client.messagesSent += 1;
        data.ip = req.connection.remoteAddress;
        console.log('0th message received');
        const isValid = await Routing.route(op.validateUser, data);
        if (isValid) {
          client.username = data.user.username;
          client.isValid = true;
        } else {
          clients.remove(client);
          client.send(
            JSON.stringify({
              type: 'error',
              message:
                'Your token could not be verified, we are trying to reconnect you',
            }),
          );
          return client.close();
        }
      }

      console.log(
        'clients',
        clients.map(client => ({
          v: client.isValid,
          name: client.username,
        })),
      );
      if (isCommand(data.message)) {
        const command = op.getCommand(data.message);
        console.log('command', command);
        if (!command) {
          return client.send(
            JSON.stringify({
              type: 'error',
              message: 'Command not supported',
            }),
          );
        }

        let response = await ClientRouting.route(command);

        return client.send(
          JSON.stringify({
            type: 'system',
            message: response,
          }),
        );
      }

      broadcast(client, data.message);
    });
  });
}

main();

server.listen(PORT, () => {
  console.log(`[SETUP] Server listening on port ${PORT}`);
});
