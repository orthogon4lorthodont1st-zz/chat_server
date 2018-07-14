'use strict';

const WebSocketClient = require('./client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function init() {
  rl.question('Please provide a username: ', answer => {
    client.write(answer);
    rl.setPrompt(`${answer}: `);
    rl.prompt();
    rl.close();
  });
}

const wsc = new WebSocketClient('ws://localhost:3000/');

wsc.open();

setTimeout(() => wsc.send('A'), 1000);
