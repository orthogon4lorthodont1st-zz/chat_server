module.exports = {
  createUser: 'createUser',
  deleteUser: 'deleteUser',
  getOperation: message => {
    switch (message) {
      case '/users':
        return 'getUsers';
      default:
        return null;
    }
  },
};
