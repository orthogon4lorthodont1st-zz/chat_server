'use strict';

const WebSocket = require('ws');
const chalk = require('chalk');

module.exports = class WebSocketClient {
  constructor(url) {
    this.autoReconnectInterval = 2 * 1000;
    this.url = url;
  }

  open() {
    this.instance = new WebSocket(this.url);

    this.instance.on('open', () => {
      this.onopen();
    });

    this.instance.on('message', data => {
      this.onmessage(data);
    });

    this.instance.on('close', e => {
      console.log(chalk.red('\n \n Connection closed'));
      switch (e.code) {
        case 1000:
          console.log('WebSocket: closed normally');
          break;
        default:
          this.reconnect();
          break;
      }
    });

    this.instance.on('error', e => {
      switch (e.code) {
        case 'ECONNREFUSED':
          this.reconnect();
          break;
        default:
          console.log('WebSocketClient: error', e);
          break;
      }
    });
  }

  send(data) {
    if (!data) {
      return;
    }

    try {
      if ((this.instance.readyState = WebSocket.OPEN)) {
        this.instance.send(data);
      } else {
      }
    } catch (e) {
      this.instance.emit('error', e);
    }
  }

  reconnect() {
    this.instance.removeAllListeners();
    setTimeout(() => {
      console.log(chalk.green('\n WebSocketClient: reconnecting...\n'));
      this.open(this.url);
    }, this.autoReconnectInterval);
  }
};
