'use strict';

const WebSocket = require('ws');

module.exports = class WebSocketClient {
  constructor(url) {
    this.autoReconnectInterval = 2 * 1000; // ms
    this.url = url;
  }

  open() {
    this.instance = new WebSocket(this.url);

    this.instance.on('open', () => {
      this.onopen();
    });

    this.instance.on('message', data => {
      console.log(data);
    });

    this.instance.on('close', e => {
      switch (e.code) {
        case 1000: // CLOSE_NORMAL
          console.log('WebSocket: closed');
          break;
        default:
          // Abnormal closure
          this.reconnect(e);
          break;
      }
    });

    this.instance.on('error', e => {
      switch (e.code) {
        case 'ECONNREFUSED':
          this.reconnect(e);
          break;
        default:
          console.log('WebSocketClient: error');
          break;
      }
    });
  }

  send(data) {
    try {
      this.instance.send(data);
    } catch (e) {
      this.instance.emit('error', e);
    }
  }

  reconnect(e) {
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
    this.instance.removeAllListeners();
    const that = this;
    setTimeout(() => {
      console.log('WebSocketClient: reconnecting...');
      this.open(this.url);
    }, this.autoReconnectInterval);
  }
};
