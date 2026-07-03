const path = require('path');

const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env'),
  });
}

const stripQuotes = (value) => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const getMongoUri = () =>
  stripQuotes(
    process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || ''
  );

const getMongoClusterHost = () => {
  const uri = getMongoUri();
  const match = uri.match(/@([^/?]+)/);

  return match ? match[1] : null;
};

const getJwtSecret = () => (process.env.JWT_SECRET || '').trim();

const getSmtpHost = () => (process.env.SMTP_HOST || '').trim();

const getSmtpPort = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  return Number.isFinite(port) && port > 0 ? port : 587;
};

const getSmtpUser = () => (process.env.SMTP_USER || '').trim();

const getSmtpPass = () => (process.env.SMTP_PASS || '').trim();

const getSmtpFrom = () =>
  (process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@patented.app').trim();

const isEmailConfigured = () =>
  Boolean(getSmtpHost() && getSmtpUser() && getSmtpPass());

const logEnvDiagnostics = () => {
  const mongoUri = getMongoUri();

  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL:', process.env.VERCEL);
  console.log('MONGO_URI configured:', Boolean(mongoUri));
  console.log('MONGO_URI length:', mongoUri.length);
  console.log('JWT_SECRET configured:', Boolean(getJwtSecret()));
};

module.exports = {
  getMongoUri,
  getMongoClusterHost,
  getJwtSecret,
  getSmtpHost,
  getSmtpPort,
  getSmtpUser,
  getSmtpPass,
  getSmtpFrom,
  isEmailConfigured,
  isVercel,
  logEnvDiagnostics,
};
