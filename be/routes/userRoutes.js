const express = require('express');

const {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgetPassword,
} = require('../controllers/userController');
const { protectMiddleware } = require('../mdidleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logout);
router.get('/getUser', protectMiddleware, getUser);
router.get('/login-status', loginStatus);
router.patch('/update-user', protectMiddleware, updateUser);
router.patch('/change-password', protectMiddleware, changePassword);
router.route('/forget-password').post(forgetPassword);
module.exports = router;
