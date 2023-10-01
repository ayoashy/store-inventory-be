const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// register user controller
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
    // generate token
    const token = generateToken(user._id);

    // send HTTP-only cookie
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // a day
      sameSite: 'none',
      secure: true,
    });

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

// login user controller
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // validate expected inputs
  if (!email || !password) {
    res.status(400);
    throw new Error('please provide all credentials');
  }
  // check if user exist
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error('user do not exist');
  }

  // user exist  but password do not match
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    res.status(400);
    throw new Error('Invalid credentials');
  }

  if (user && isPasswordMatch) {
    // generate token
    const token = generateToken(user._id);

    // send HTTP-only cookie
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // a day
      sameSite: 'none',
      secure: true,
    });
    const { password, email, name, _id, photo, bio } = user;
    res.status(200).json({
      password,
      email,
      name,
      _id,
      token,
      photo,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error('user not known');
  }
});

// log user out
const logout = asyncHandler(async (req, res) => {
  // modify HTTP-only cookie to log user out
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0), // right away
    sameSite: 'none',
    secure: true,
  });
  return res.status(200).json({
    message: 'User successfully logged out',
  });
});

// get user controller
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.status(200).json({ user });
  } else {
    res.send('user not found');
  }
});

// get user login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.json({ status: false });
  }

  // verify token
  const isTokenVerified = jwt.verify(token, process.env.JWT_SECRET);
  if (!isTokenVerified) {
    res.status(400);
    throw new Error('token not valid');
  }
  // match token id and req id
  const tokenId = isTokenVerified.id.toString();

  if (!tokenId) {
    res.status(400).json({ message: 'no token' });
  }
  res.status(200).json({ status: true });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(400);
    throw new Error('User not found!');
  }
  const { email, bio, name, photo, phone } = user;
  user.email = email;
  user.name = req.body.name || name;
  user.bio = req.body.bio || bio;
  user.photo = req.body.photo || photo;
  user.phone = req.body.phone || phone;

  const updatedUser = await user.save();

  if (!updateUser) {
    res.status(400);
    res.send('fail to save changes');
  }

  res.status(200).json({
    status: 'done',
    user,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(400);
    throw new Error('user not found');
  }
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new Error('please provide password');
  }
  const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordMatch) {
    res.status(400);
    throw new Error('password mismatch');
  }
  if (user && isPasswordMatch) {
    user.password = req.body.newPassword;
    await user.save();
    res.status(200).json({ status: 'password changed', user });
  } else {
    res.status(400);
    throw new Error('problem changing the password');
  }
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
};
