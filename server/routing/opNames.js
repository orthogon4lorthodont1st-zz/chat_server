module.exports = {
  createUser: 'createUser',
  deleteUser: 'deleteUser',
  validateUser: 'validateUser',
  getCommand: message => {
    switch (message.split(' ')[0]) {
      case '/users':
        return 'getUsers';
      default:
        return null;
    }
  },
};
