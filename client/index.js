'use strict';

const readline = require('readline');

const chalk = require('chalk');
const figlet = require('figlet');

const processCommand = require('./user-functions.js');
const WebSocketClient = require('./client.js');
let wsc;
try {
  wsc = new WebSocketClient('ws://localhost:3000/');
} catch (err) {
  console.log('err', err);
}

let username;
let rl;

function createInterface() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
}

function console_out(data) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(data);
  rl.prompt();
}

function init() {
  console.log('\x1Bc');
  console.log(
    chalk.yellow.bold(
      figlet.textSync('CLI - CHAT', {
        horizontalLayout: 'full',
        verticalLayout: 'full',
      }),
    ),
  );

  rl.question(chalk.cyan('Please provide a username: '), answer => {
    username = answer;
    rl.setPrompt(chalk.magenta(`${username}: `));
    rl.prompt();
    wsc.send(username);
  });
}

function setupRLInterface() {
  if (rl) {
    rl.close();
  }
  createInterface();
  rl.setPrompt(chalk.magenta(`${username}: `));

  if (!username) {
    init();
  } else {
    rl.prompt();
  }
}

function main() {
  wsc.open();

  wsc.onopen = () => {
    setupRLInterface();

    rl.on('line', input => {
      if (input.split('')[0] === '/') {
        processCommand(input);
      }
      wsc.send(input);
      rl.prompt();
    });
  };

  wsc.onmessage = data => {
    console_out(data);
  };
}

try {
  main();
} catch (err) {
  console.log('err', err);
}
