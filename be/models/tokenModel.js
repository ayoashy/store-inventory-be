const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'userId is required'],
    ref: 'user',
  },
  token: {
    type: string,
    required: [true, 'token is required'],
  },
  createdAt: {
    type: Date,
    required: [true, 'provide date'],
  },
  expiresAt: {
    type: Date,
    required: [true, 'provide date'],
  },
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
