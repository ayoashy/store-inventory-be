const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('please provide required fields');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('password must be at least 6 characters');
  }

  // check if email already exist
  const isEmailExist = await User.findOne({ email });

  if (isEmailExist) {
    res.status(400);
    throw new Error('Email already registered');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    const token = generateToken(user._id);

    const { name, email, _id, photo, bio, phone, password } = user;
    res.status(201).json({
      name,
      email,
      _id,
      photo,
      bio,
      phone,
      password,
      token,
    });
  } else {
    throw new Error('no user found!');
  }
});

module.exports = {
  registerUser,
};
