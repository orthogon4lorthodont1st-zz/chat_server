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

module.exports = class UserColourHandler {
  static getUserColour(data) {
    const username = data.split(':')[0];

    if (userColours[username]) {
      return userColours[username];
    }

    const rand = Math.floor(Math.random() * colours.length);
    const myColour = colours[rand];

    userColours[username] = myColour;

    return userColours[username];
  }
};
