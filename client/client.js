'use strict';

const WebSocket = require('ws');
const readline = require('readline');

let ws = new ReconnectingWebSocket('ws://localhost:3000');
let interval;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function attemptReconnect() {
  interval = setInterval(() => {
    console.log('Attempting to reconnect... \n');
    ws = new WebSocket('ws://localhost:3000');
    ws.on('error', err => {
      console.log('err', err);
    });
  }, 1000);
}

function init() {
  rl.question('Please provide a username: ', answer => {
    rl.setPrompt(`${answer}: `);
    rl.prompt();
    rl.close();
  });
}

function operations() {
  ws.on('open', () => {
    if (interval) {
      clearInterval(interval);
    }
    console.log('Connection established');
    ws.send('something');
  });

  ws.on('message', data => {
    console.log(`${data}\n`);
  });

  ws.on('close', () => {
    console.log('Server is offline \n');
    attemptReconnect();
  });
}

function main() {
  init();
  operations();
}

main();
