'use strict';

const mongoDB = require('./db/index.js');

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
      .find({
        token,
      })
      .toArray()
      .catch(err => {
        throw err;
      });

    return user;
  }

  async deleteUser(username) {
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

  async validateUser(user) {
    const dbUser = await this.getUserByToken(user.token);
    console.log('DB', dbUser, 'user', user);
    return (
      dbUser[0].username === user.username &&
      dbUser[0].ip === user.ip &&
      dbUser[0].token === user.token
    );
  }
};
