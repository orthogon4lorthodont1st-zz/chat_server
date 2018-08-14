'use strict';

const mongoDB = require('../db/index.js');

module.exports = class DatabaseOperations {
  constructor() {
    this.db = mongoDB.getDB();
  }

  async createUser(username, ip, token) {
    return this.db
      .collection('users')
      .insertOne({
        username,
        token,
        ip,
        date: new Date(),
      })
      .then(result => {
        return result.ops[0];
      })
      .catch(err => {
        throw err;
      });
  }

  async checkUsername(username) {
    const user = await this.db
      .collection('users')
      .find({
        username,
      })
      .toArray()
      .catch(err => {
        throw err;
      });

    return user;
  }

  async getUserByToken(token) {
    const user = await this.db
      .collection('users')
      .findAndModify({ token }, [], { $set: { isValid: true } })
      .catch(err => {
        throw err;
      });

    return user.value;
  }

  async deleteUser(username) {
    return this.db
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

    return users.map(user => user.username);
  }

  async validateUser(user) {
    const dbUser = await this.getUserByToken(user.token);

    if (!dbUser) {
      return false;
    }

    return (
      dbUser.id === user.id &&
      dbUser.username === user.username &&
      dbUser.ip === user.ip &&
      dbUser.token === user.token
    );
  }
};
