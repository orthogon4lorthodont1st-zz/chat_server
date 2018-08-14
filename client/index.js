'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const readline = require('readline');
const rp = require('request-promise');
const chalk = require('chalk');
const figlet = require('figlet');

const WebSocketClient = require('./client.js');
const errors = require('./utils/errors.js');
const Utils = require('./utils/utils.js');
const CommandsService = require('./commands/commands.js');

const wsc = new WebSocketClient('wss://localhost:3000/');

let isFirstMessage = true;
let user;
let rl;
let token;

function validateMessage(data) {
  if (!data) {
    Utils.printErrorMessage('Malformed message', user, rl);
    return;
  }

  if (!data.type || !data.message) {
    Utils.printErrorMessage(
      'Could not process, missing type or message keys',
      user,
      rl,
    );
    return;
  }

  if (data.type === 'clientMessage' && !data.username) {
    Utils.printErrorMessage('Could not process, missing username', user, rl);
    return;
  }
}

/**
 * @param {String} data Data sent from server
 */
function handleMessage(data) {
  validateMessage(data);

  const { type, message } = data;

  if (type === 'clientMessage') {
    const username = { data };
    const colour = Utils.getUserColour(username);
    Utils.printClientMessage(data, colour, user, rl);
  } else if (type === 'system') {
    Utils.printSystemMessage(message, user, rl);
  } else if (type === 'error') {
    if (message === errors.invalidUser) {
      user = null;
      setupRLInterface();
    }
    Utils.printErrorMessage(message, user, rl);
  } else {
    Utils.printErrorMessage('Could not process message', user, rl);
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
        'After entering a username, type any command to activate. Type /list to see operations. \n',
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
        rl.setPrompt(chalk.magenta(`${user.username}`) + ': ');
        rl.prompt();
      })
      .catch(err => {
        if (err.error.message === errors.usernameTaken) {
          Utils.printErrorMessage(err.error.message, user, rl);
          askForUsername();
        } else {
          Utils.printErrorMessage(err.error.message, user, rl);
        }
      });
  }
}

async function connectSockets() {
  wsc.open();

  wsc.onopen = async () => {
    setupRLInterface();

    rl.on('line', message => {
      if (Utils.isCommand(message)) {
        return new CommandsService(wsc, user, rl).process(message);
      }

      if (isFirstMessage) {
        isFirstMessage = false;
        wsc.send(
          JSON.stringify({
            user,
            message,
          }),
        );
        rl.prompt();
      } else {
        wsc.send(
          JSON.stringify({
            message,
          }),
        );
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
