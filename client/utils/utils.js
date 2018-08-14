const chalk = require('chalk');

const userColours = {};

const colours = [
  'red',
  'green',
  'yellow',
  'blue',
  'cyan',
  'white',
  'gray',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
  'whiteBright',
];

module.exports = class Utils {
  static getUserColour(username) {
    if (userColours[username]) {
      return userColours[username];
    }

    const rand = Math.floor(Math.random() * colours.length);
    const myColour = colours[rand];

    userColours[username] = myColour;

    return userColours[username];
  }

  static isCommand(message) {
    return message.split('')[0] === '/';
  }

  static printClientMessage(data, colour, user, rl) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(`${chalk[colour](data.username)}: ${data.message}`);
    if (user) {
      rl.prompt();
    }
  }

  static printSystemMessage(data, user, rl) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(data);
    if (user) {
      rl.prompt();
    }
  }

  static printErrorMessage(data, user, rl) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(chalk.bgBlue(data));
    if (user) {
      rl.prompt();
    }
  }
};
