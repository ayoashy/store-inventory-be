const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Token = require('../models/tokenModel');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

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
    sendEmail(
      'Register',
      `<p>Hi ${user.name},Welcome to the thing we are cooking!</p>
<p>Hope you have a nice meal</p>`,
      user.email,
      process.env.EMAIL_USER
    );
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
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // validate expected inputs
  if (!email || !password) {
    throw new Error('Please provide all field');
  }
  // check if user exist
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error('user do not exist');
  }

  // check if password match
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
  const user = await User.findById(req.user._id).select('-password');
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

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide email');
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('Email do not exist!');
  }

  // delete token if it exist
  const token = await Token.findOne({ userId: user._id });

  if (token) {
    await token.deleteOne();
  }

  // create reset token
  let resetToken = crypto.randomBytes(32).toString('hex') + user._id;

  // hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // save token to DB

  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000),
  }).save();

  // construct frontend url
  const url = `${process.env.FRONTEND_URL}/reset-password/?token=${resetToken}`;

  // construct email
  const message = `
<h2>Hello ${user.name}</h2>    
<p>Please use this link to reset your password</p>
<p>The reset link is valid for o nly 30 minutes</p>
<a href=${url}>${url}</a>
<p style="color: red ; font-size: 16px; font-weight: bold;">Love</p>
  `;

  const subject = 'password reset request';

  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  // send email

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: 'done', resetToken });
  } catch (error) {
    res.status(500);
    console.log(error);
    throw new Error("didn't done");
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  if (!password) {
    res.status(404);
    throw new Error('please provide email');
  }

  // hash token then compare to what is in the DB
  const hashToken = crypto
    .createHash('SHA256')
    .update(resetToken)
    .digest('hex');

  // find token in DB
  const token = await Token.findOne({
    token: hashToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!token) {
    res.status(404);
    throw new Error('token might be expired');
  }

  // find user
  const user = await User.findById(token.userId);
  user.password = password;
  await user.save();

  // delete token so it can only be used once
  await token.deleteOne();

  res.status(200).json({
    message: 'password reset successful',
  });
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgetPassword,
  resetPassword,
};
