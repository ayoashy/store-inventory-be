const dotenv = require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoute = require('./routes/userRoutes');
const errorHandler = require('./mdidleware/errorMiddleware');

const app = express();

// MiddleWares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes middleware
app.use('/api/users', userRoute);

// routes
app.get('/', (req, res) => {
  res.send('home page');
});

// Error handler middleware
app.use(errorHandler);

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
