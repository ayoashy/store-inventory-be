const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const protectMiddleware = asyncHandler(async (req, res, next) => {
  // check for token
  const token = req.cookies.token;
  if (!token) {
    res.status(401);
    throw new Error('unauthorized request');
  }

  // verify token.
  const isTokenVerified = jwt.verify(token, process.env.JWT_SECRET);
  // variable return three props(id,iat,exp)

  // get userID from token
  const userObj = await User.findById(isTokenVerified.id).select('-password');
  if (isTokenVerified && userObj) {
    // add user object to req
    req.user = userObj;
    next();
  } else {
    res.status(401).send('user not authorized!');
  }
});

module.exports = {
  protectMiddleware,
};
