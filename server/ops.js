module.exports = {
  createUser: 'createUser',
  deleteUser: 'deleteUser',
  getCommand: message => {
    switch (message) {
      case '/users':
        return 'getUsers';
      default:
        return null;
    }
  },
};
