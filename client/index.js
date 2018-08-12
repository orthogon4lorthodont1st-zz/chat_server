'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const readline = require('readline');
const rp = require('request-promise');
const chalk = require('chalk');
const figlet = require('figlet');

const UserColourHandler = require('./handleUserColours');
const WebSocketClient = require('./client.js');
const errors = require('./errors');
const wsc = new WebSocketClient('wss://localhost:3000/');

let isFirstMessage = true;
let user;
let rl;
let token;

function printClientMessage(data, colour) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`${chalk[colour](data.username)}: ${data.message}`);
  if (user) {
    rl.prompt();
  }
}

function printSystemMessage(data) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(data);
  if (user) {
    rl.prompt();
  }
}

function printErrorMessage(data) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(chalk.bgBlue(data));
  if (user) {
    rl.prompt();
  }
}

function validateMessage(data) {
  if (!data) {
    printErrorMessage('Malformed message');
    return;
  }

  if (!data.type || !data.message) {
    printErrorMessage('Could not process, missing type or message');
    return;
  }

  if (data.type === 'clientMessage' && !data.username) {
    printErrorMessage('Could not process, missing username');
    return;
  }
}

/**
 * @param {String} data Data sent from server
 */
function handleMessage(data) {
  validateMessage();

  const { type, message } = data;

  if (type === 'clientMessage') {
    const username = { data };
    const colour = UserColourHandler.getUserColour(username);
    printClientMessage(data, colour);
  } else if (type === 'system') {
    printSystemMessage(message);
  } else if (type === 'error') {
    printErrorMessage(message);
  } else {
    printErrorMessage('Could not process message');
  }
}

function askForUsername() {
  rl.question(chalk.greenBright('Please provide a username:') + ' ', answer => {
    if (!answer || answer.length === 0) {
      askForUsername();
    } else {
      return attemptSetUp(answer);
    }
  });
}

/**
 * Set up interface, allowing for reconnections to the server.
 */
function setupRLInterface() {
  if (rl) {
    rl.close();
  }

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  if (user) {
    rl.setPrompt(chalk.magenta(`${user.username}`) + ': ');
    rl.prompt();
  } else {
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
    askForUsername();
  }
}

function attemptSetUp(answer) {
  if (!user) {
    return rp({
      uri: 'https://localhost:3000/v1/user',
      method: 'POST',
      strictSSL: false,
      body: {
        username: answer,
      },
      json: true,
    })
      .then(result => {
        user = result.user;
        token = result.token;
        rl.setPrompt(chalk.magenta(`${user.username}`) + ': ');
        rl.prompt();
      })
      .catch(err => {
        if (err.error.message === errors.usernameTaken) {
          printErrorMessage(err.error.message);
          askForUsername();
        } else {
          printErrorMessage(err.error.message);
        }
      });
  }
}

async function connectSockets() {
  wsc.open();

  wsc.onopen = async () => {
    setupRLInterface();
    rl.on('line', message => {
      console.log('line input');
      if (isFirstMessage) {
        console.log('first message', user);
        wsc.send({
          user,
        });
        isFirstMessage = false;
        rl.prompt();
      } else {
        console.log('ont first');
        wsc.send({
          message,
        });
        rl.prompt();
      }
    });
  };

  wsc.onmessage = data => {
    data = JSON.parse(data);
    handleMessage(data);
  };
}

async function main() {
  try {
    connectSockets();
  } catch (err) {
    console.log('Error establishing connection', err);
  }
}

main();
