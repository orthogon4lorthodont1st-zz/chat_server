const fs = require('fs');
const path = require('path');
const Utils = require('../utils/utils.js');

module.exports = class CommandsService {
  constructor(wsc, user, rl) {
    this.user = user;
    this.wsc = wsc;
    this.rl = rl;
  }

  process(message) {
    if (message.split(' ')[0] === '/send') {
      if (!message.split(' ')[1]) {
        Utils.printErrorMessage('Path must be given', this.user, this.rl);
        return;
      }

      const filePath = message.split(' ')[1];

      // if (!message.split[2]) {
      //   Utils.printErrorMessage('Recipient must be given');
      // }

      const readStream = fs.createReadStream(
        path.join(__dirname, `../${filePath}`),
      );

      readStream.on('data', data => {
        console.log('data', data);
        return this.wsc.send(data);
      });

      readStream.on('close', () => {
        console.log('CLOSED');
        this.rl.prompt();
      });
    }
  }
};
