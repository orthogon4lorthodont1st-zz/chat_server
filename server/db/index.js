'use strict';

const MongoClient = require('mongodb').MongoClient;

module.exports = class Database {
  static async connect() {
    try {
      const client = await MongoClient.connect(
        'mongodb://localhost:27017',
        { useNewUrlParser: true },
      );

      this.db = client.db('testdb');
    } catch (err) {
      throw err;
    }
  }

  static getDB() {
    return this.db;
  }
};
