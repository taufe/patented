const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminCourseRoutes = require('./routes/admin/courseRoutes');
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes');
const adminUserRoutes = require('./routes/admin/userRoutes');
const userCourseRoutes = require('./routes/user/courseRoutes');
const meRoutes = require('./routes/user/meRoutes');
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

    const isServerSelectionError = /Could not connect to any servers/i.test(
      error.message
    );
    const isVercelDeployment = Boolean(process.env.VERCEL);

    res.status(500).json({
      success: false,
      message: isServerSelectionError
        ? isVercelDeployment
          ? 'Database connection failed on Vercel (usually DNS/SRV, not IP whitelist if 0.0.0.0/0 is already Active).'
          : 'Database connection failed. Check Atlas Network Access and MONGO_URI.'
        : 'Database connection failed',
      error: error.message,
      ...(isServerSelectionError && {
        fix: isVercelDeployment
          ? [
              'Confirm 0.0.0.0/0 shows Status = Active in Atlas Network Access',
              'Redeploy on Vercel after pulling the latest backend (uses direct MongoDB hosts on Vercel)',
              'In Vercel → Settings → Environment Variables, re-save MONGO_URI with no quotes or trailing spaces',
              'If it still fails, replace MONGO_URI in Vercel with the non-SRV connection string from Atlas → Connect → Drivers',
            ]
          : [
              'Open MongoDB Atlas → Security → Network Access',
              'Add 0.0.0.0/0 (Allow Access from Anywhere) if deploying to Vercel',
              'Wait 1-2 minutes, then retry',
            ],
      }),
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminCourseRoutes);
app.use('/api', meRoutes);
app.use('/api', userCourseRoutes);

module.exports = app;
