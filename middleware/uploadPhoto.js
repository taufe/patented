const multer = require('multer');
const { getPhotoMaxFileBytes } = require('../config/env');
const { MIME_TO_KIND } = require('../utils/imageSignature');

const PHOTO_FIELD_NAMES = ['photo', 'file', 'image'];
const INVALID_PHOTO_MESSAGE = 'Please upload a JPG, PNG, or WEBP image under 5MB';

const createUploader = () =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: getPhotoMaxFileBytes(),
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      const mime = String(file.mimetype || '').toLowerCase();

      if (MIME_TO_KIND[mime] || mime === 'application/octet-stream') {
        return cb(null, true);
      }

      const error = new Error(INVALID_PHOTO_MESSAGE);
      error.statusCode = 400;
      return cb(error);
    },
  });

const pickPhotoFile = (req) => {
  if (req.file) {
    return req.file;
  }

  const files = req.files;

  if (!files) {
    return null;
  }

  if (Array.isArray(files)) {
    return files.find((file) => PHOTO_FIELD_NAMES.includes(file.fieldname)) || null;
  }

  for (const name of PHOTO_FIELD_NAMES) {
    if (files[name] && files[name][0]) {
      return files[name][0];
    }
  }

  return null;
};

const handleUploadError = (err, res) => {
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: INVALID_PHOTO_MESSAGE,
    });
  }

  return res.status(err.statusCode || 400).json({
    success: false,
    message: err.statusCode === 400 ? INVALID_PHOTO_MESSAGE : err.message || INVALID_PHOTO_MESSAGE,
  });
};

const uploadPhoto = (req, res, next) => {
  createUploader().any()(req, res, (err) => {
    if (err) {
      return handleUploadError(err, res);
    }

    req.photoFile = pickPhotoFile(req);

    if (!req.photoFile) {
      return res.status(400).json({
        success: false,
        message: INVALID_PHOTO_MESSAGE,
      });
    }

    next();
  });
};

module.exports = {
  INVALID_PHOTO_MESSAGE,
  uploadPhoto,
};
