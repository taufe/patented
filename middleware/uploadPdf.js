const multer = require('multer');
const { getPdfMaxFileBytes, getPdfMaxFileMb } = require('../config/env');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/octet-stream',
]);

const createUploader = () =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: getPdfMaxFileBytes(),
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      const name = String(file.originalname || '').toLowerCase();
      const mime = String(file.mimetype || '').toLowerCase();

      if (!ALLOWED_MIME_TYPES.has(mime) || !name.endsWith('.pdf')) {
        const error = new Error('Only PDF files are allowed');
        error.statusCode = 400;
        return cb(error);
      }

      cb(null, true);
    },
  });

const handleUploadError = (err, res) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: `PDF must be ${getPdfMaxFileMb()}MB or smaller`,
    });
  }

  return res.status(err.statusCode || 400).json({
    success: false,
    message: err.message || 'Invalid PDF upload',
  });
};

const uploadPdf = ({ required } = {}) => (req, res, next) => {
  createUploader().single('file')(req, res, (err) => {
    if (err) {
      return handleUploadError(err, res);
    }

    if (required && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
      });
    }

    next();
  });
};

module.exports = {
  uploadPdf,
};
