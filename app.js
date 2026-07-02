const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { mountSwagger } = require('./config/swagger');
const {
  getMongoUri,
  getMongoClusterHost,
  getJwtSecret,
  logEnvDiagnostics,
} = require('./config/env');

const app = express();

app.use(cors());
app.use(express.json());

mountSwagger(app);

app.get('/', (req, res) => {
  res.json({ message: 'Patented Backend API is running' });
});

app.get('/api/health', (req, res) => {
  const mongoUri = getMongoUri();

  res.json({
    success: true,
    message: 'API is healthy',
    env: {
      mongoUri: Boolean(mongoUri),
      jwtSecret: Boolean(getJwtSecret()),
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
      mongoUriLength: mongoUri.length,
      mongoCluster: getMongoClusterHost(),
    },
  });
});

app.get('/api/health/db', async (req, res) => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    return res.status(500).json({
      success: false,
      message: 'MONGO_URI is not configured on the server',
    });
  }

  try {
    await connectDB();

    res.json({
      success: true,
      message: 'Database connected successfully',
      cluster: getMongoClusterHost(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      cluster: getMongoClusterHost(),
      hint:
        'Confirm 0.0.0.0/0 is Active in Atlas Network Access for the SAME cluster shown in cluster above.',
    });
  }
});

app.use(async (req, res, next) => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    logEnvDiagnostics();

    return res.status(500).json({
      success: false,
      message: 'MONGO_URI is not configured on the server',
      debug: {
        nodeEnv: process.env.NODE_ENV,
        vercel: Boolean(process.env.VERCEL),
        hasMongoUriKey: Object.prototype.hasOwnProperty.call(process.env, 'MONGO_URI'),
        mongoUriLength: mongoUri.length,
      },
    });
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);

    const isIpWhitelistError =
      /whitelist|IP that isn't whitelisted|Could not connect to any servers/i.test(
        error.message
      );

    res.status(500).json({
      success: false,
      message: isIpWhitelistError
        ? 'MongoDB Atlas is blocking this server. Allow 0.0.0.0/0 in Atlas Network Access.'
        : 'Database connection failed',
      error: error.message,
      ...(isIpWhitelistError && {
        fix: [
          'Open MongoDB Atlas → Security → Database & Network Access → Network Access',
          'Click "Add IP Address" → choose "Allow Access from Anywhere" (0.0.0.0/0)',
          'Wait 1-2 minutes, then retry this request',
          'Required for Vercel because serverless functions use changing IP addresses',
        ],
      }),
    });
  }
});

app.use('/api/auth', authRoutes);

module.exports = app;
