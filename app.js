require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Patented Backend API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    env: {
      mongoUri: Boolean(process.env.MONGO_URI),
      jwtSecret: Boolean(process.env.JWT_SECRET),
    },
  });
});

app.use(async (req, res, next) => {
  if (!process.env.MONGO_URI) {
    return res.status(500).json({
      success: false,
      message: 'MONGO_URI is not configured on the server',
    });
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);

module.exports = app;
