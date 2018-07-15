const MongoClient = require('mongodb').MongoClient;

let _db;

module.exports = {
  connectToServer: function(callback) {
    MongoClient.connect(
      'mongodb://localhost:27017',
      { useNewUrlParser: true },
      (err, client) => {
        _db = client.db('testdb');

        return callback(err);
      },
    );
  },

  getDb: function() {
    return _db;
  },
};
