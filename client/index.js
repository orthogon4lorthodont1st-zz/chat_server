'use strict';

const readline = require('readline');

const WebSocketClient = require('./client');

const wsc = new WebSocketClient('ws://localhost:3000/');

let username;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
  prompt: 'ME: ',
});

function init() {
  rl.question('Please provide a username: ', answer => {
    username = answer;
    wsc.send(username);
    rl.prompt();
  });
}

function main() {
  wsc.open();

  wsc.onopen = () => {
    if (!username) {
      init();
    } else {
      rl.prompt();
    }

    rl.on('line', input => {
      wsc.send(input);
      rl.prompt();
    });
  };
}

main();
