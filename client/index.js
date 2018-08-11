'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const readline = require('readline');

const chalk = require('chalk');
const figlet = require('figlet');

const UserColourHandler = require('./handleUserColours');
const WebSocketClient = require('./client.js');

const wsc = new WebSocketClient('wss://localhost:3000/');

let username;
let rl;

function createInterface() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
}

function printClientMessage(data, colour) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`${chalk[colour](data.split(':')[0])}: ${data.split(':')[1]}`);
  rl.prompt();
}

function printSystemMessage(data) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(data);
  rl.prompt();
}

function printErrorMessage(data) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(chalk.bgBlue(data));
  rl.prompt();
}

/**
 * @param {String} data Data sent from server
 */
function handleMessage(data) {
  if (!data) {
    return;
  }
  const messageType = Buffer.from(data, 'base64')
    .toString()
    .split('|')[0];

  const message = Buffer.from(data, 'base64')
    .toString()
    .split('|')[1];

  if (messageType === 'client') {
    const colour = UserColourHandler.getUserColour(message);
    printClientMessage(message, colour);
  } else if (messageType === 'system') {
    printSystemMessage(message);
  } else if (messageType === 'error') {
    printErrorMessage(message);
  }
}

function askQuestion() {
  rl.question(chalk.greenBright('Please provide a username:') + ' ', answer => {
    if (!answer || answer.length === 0) {
      askQuestion();
    } else {
      username = answer;
      rl.setPrompt(chalk.magenta(`${username}`) + ': ');
      rl.prompt();
      wsc.send(username);
    }
  });
}

/**
 * Clear terminal, display header and prompt for username
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

  console.log(
    chalk.blue.bold(
      'After entering a username, type /list to see operations. \n',
    ),
  );

  askQuestion();
}

/**
 * Set up interface, allowing for reconnections to the server.
 */
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

  wsc.onopen = m => {
    setupRLInterface();

    rl.on('line', input => {
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
