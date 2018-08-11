const DatabaseOps = require('../db/operations');

module.exports = class Router {
  static async route(operation, data) {
    switch (operation) {
      case 'createUser':
        const username = data.username.trim();
        try {
          return new DatabaseOps().createUser(username);
        } catch (err) {
          throw new Error('Could not create user', err);
        }
      case 'deleteUser':
        try {
          const username = data.username;
          return new DatabaseOps().deleteUser(username);
        } catch (err) {
          throw new Error('Could not delete user', err);
        }
      case 'getUsers':
        try {
          return new DatabaseOps().getUsers();
        } catch (err) {
          throw new Error('Could not retrieve users');
        }
      default:
        return 'Did not match';
    }
  }
};
