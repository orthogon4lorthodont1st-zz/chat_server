'use strict';

const readline = require('readline');

const chalk = require('chalk');
const figlet = require('figlet');

const processCommand = require('./operations.js');
const UserColourHandler = require('./handleUserColours');
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

function printMessage(data, colour) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`${chalk[colour](data.split(':')[0])}: ${data.split(':')[1]}`);
  rl.prompt();
}

function handleMessage(data) {
  if (!data) {
    return;
  }
  const colour = UserColourHandler.getUserColour(data);
  printMessage(data, colour);
}

/**
 * Clear terminal and display header
 */
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

  rl.question(chalk.bgRed('Please provide a username:') + ' ', answer => {
    username = answer;
    rl.setPrompt(chalk.magenta(`${username}`) + ': ');
    rl.prompt();
    wsc.send(username);
  });
}

function setupRLInterface() {
  if (rl) {
    rl.close();
  }

  createInterface();

  if (username) {
    rl.setPrompt(chalk.magenta(`${username}`) + ': ');
    rl.prompt();
  } else {
    init();
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
    handleMessage(data);
  };
}

try {
  main();
} catch (err) {
  console.log('err', err);
}
