const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const protectMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401);
    throw new Error('unauthorized request');
  }

  // verify token
  const isTokenVerified = jwt.verify(token, process.env.JWT_SECRET);

  // get userID from token
  const userId = await User.findById(isTokenVerified.id).select('-password');
  if (isTokenVerified && userId) {
    req.user = userId;
    next();
  } else {
    res.status(401).send('user not authorized!');
  }
});

module.exports = {
  protectMiddleware,
};
