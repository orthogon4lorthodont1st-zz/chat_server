'use strict';

const MongoClient = require('mongodb').MongoClient;

module.exports = class Database {
  static async connect() {
    const client = await MongoClient.connect(
      'mongodb://localhost:27017',
      { useNewUrlParser: true },
    );

    this.db = client.db('testdb');
  }

  static getDB() {
    return this.db;
  }
};
