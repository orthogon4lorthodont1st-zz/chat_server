const router = require('express').Router();
const crypto = require('crypto');
const DatabaseOps = require('../services/dbOperations.js');

router.post('/user', async (req, res) => {
  try {
    if (!req.body.username) {
      return res.status(400).send({ message: 'Must provide username' });
    }
    const token = crypto.randomBytes(256).toString('hex');
    const username = req.body.username.trim();
    const ip = req.ip;

    const currUser = await new DatabaseOps().checkUsername(username);

    if (currUser && currUser.length > 1) {
      return res.status(400).send({ message: 'Username taken' });
    }

    const user = await new DatabaseOps().createUser(username, ip, token);

    return res.json({ user });
  } catch (err) {
    throw new Error('Could not create user', err);
  }
});

module.exports = router;
