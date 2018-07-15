'use strict';

const mongoDB = require('../db/index.js');

module.exports = class DatabaseOperations {
  constructor() {
    this.db = mongoDB.getDB();
  }

  async getUsers() {
    const users = await this.db
      .collection('users')
      .find()
      .toArray();
    return users;
  }
};
