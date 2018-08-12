module.exports = {
  createUser: 'createUser',
  deleteUser: 'deleteUser',
  validateUser: 'validateUser',
  getCommand: message => {
    switch (message) {
      case '/users':
        return 'getUsers';
      default:
        return null;
    }
  },
};
