'use strict';

const mongoDB = require('../db/index.js');

module.exports = class DatabaseOperations {
  constructor() {
    this.db = mongoDB.getDB();
  }

  async createUser(username) {
    await this.db
      .collection('users')
      .update({ username }, { username }, { upsert: true })
      .catch(err => {
        throw err;
      });
  }

  async deleteUsers(username) {
    await this.db
      .collection('users')
      .remove({
        username,
      })
      .catch(err => {
        throw err;
      });
  }

  async getUsers() {
    const users = await this.db
      .collection('users')
      .find()
      .toArray()
      .catch(err => {
        throw err;
      });

    return users;
  }
};
