const express = require('express');

const {
  registerUser,
  loginUser,
  logout,
  getUser,
} = require('../controllers/userController');
const { protectMiddleware } = require('../mdidleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logout);
router.get('/getUser', protectMiddleware, getUser);

module.exports = router;
