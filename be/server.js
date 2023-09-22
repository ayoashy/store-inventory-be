const dotenv = require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('mongoose db is connected');
    app.listen(PORT, () => console.log('app listening on -->', PORT));
  } catch (error) {
    console.log(error);
  }
};

connectDB();
