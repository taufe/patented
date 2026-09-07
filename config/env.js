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

const getVideoCompletionThreshold = () => {
  const parsed = Number(process.env.VIDEO_COMPLETION_THRESHOLD || 0.95);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) {
    return 0.95;
  }

  return parsed;
};

const getFirebaseProjectId = () => (process.env.FIREBASE_PROJECT_ID || '').trim();

const getFirebaseClientEmail = () => (process.env.FIREBASE_CLIENT_EMAIL || '').trim();

const getFirebasePrivateKey = () =>
  (process.env.FIREBASE_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');

const getFirebaseServiceAccountJson = () => (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();

const getFirebaseCredentials = () => {
  const rawJson = getFirebaseServiceAccountJson();

  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: String(parsed.private_key).replace(/\\n/g, '\n'),
        };
      }
    } catch (error) {
      return null;
    }
  }

  const projectId = getFirebaseProjectId();
  const clientEmail = getFirebaseClientEmail();
  const privateKey = getFirebasePrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
};

const isFcmConfigured = () => Boolean(getFirebaseCredentials());

const getPdfMaxFileMb = () => {
  const parsed = Number(process.env.PDF_MAX_FILE_MB || 15);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 50) {
    return 15;
  }

  return parsed;
};

const getPdfMaxFileBytes = () => getPdfMaxFileMb() * 1024 * 1024;

const PHOTO_MAX_FILE_MB = 5;

const getPhotoMaxFileMb = () => PHOTO_MAX_FILE_MB;

const getPhotoMaxFileBytes = () => getPhotoMaxFileMb() * 1024 * 1024;

const getPublicBaseUrl = (req) => {
  const configured = stripQuotes(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

  if (configured) {
    return configured;
  }

  if (req) {
    const host = String(req.get('x-forwarded-host') || req.get('host') || '')
      .split(',')[0]
      .trim();

    if (host) {
      const forwardedProto = String(req.get('x-forwarded-proto') || '')
        .split(',')[0]
        .trim();
      const proto = isVercel
        ? 'https'
        : forwardedProto || (/vercel\.app$/i.test(host) ? 'https' : req.protocol || 'http');

      return `${proto}://${host}`;
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}`;
  }

  return `http://localhost:${process.env.PORT || 5001}`;
};

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
  getVideoCompletionThreshold,
  getFirebaseCredentials,
  isFcmConfigured,
  getPdfMaxFileMb,
  getPdfMaxFileBytes,
  getPhotoMaxFileMb,
  getPhotoMaxFileBytes,
  getPublicBaseUrl,
};
