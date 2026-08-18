const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

const BUCKET_NAME = 'learning_pdfs';
const PDF_MAGIC = Buffer.from('%PDF');

const getBucket = () => {
  const db = mongoose.connection.db;

  if (!db) {
    const error = new Error('Database not connected');
    error.statusCode = 500;
    throw error;
  }

  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
};

const isPdfBuffer = (buffer) =>
  Boolean(buffer) && buffer.length >= 5 && buffer.subarray(0, 4).equals(PDF_MAGIC);

const toObjectId = (id) => {
  try {
    return new ObjectId(String(id));
  } catch (error) {
    const invalid = new Error('Invalid storage key');
    invalid.statusCode = 500;
    throw invalid;
  }
};

const uploadPdfBuffer = ({ buffer, filename, contentType = 'application/pdf', metadata = {} }) =>
  new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata,
    });
    let settled = false;

    const fail = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    };

    const succeed = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve({
        storageKey: String(uploadStream.id),
        storedFileName: uploadStream.filename,
        fileSize: uploadStream.length || buffer.length,
      });
    };

    uploadStream.once('error', fail);
    uploadStream.once('finish', succeed);
    uploadStream.end(buffer);
  });

const openPdfDownloadStream = (storageKey) => getBucket().openDownloadStream(toObjectId(storageKey));

const deleteStoredPdf = async (storageKey) => {
  if (!storageKey) {
    return;
  }

  try {
    await getBucket().delete(toObjectId(storageKey));
  } catch (error) {
    if (!/FileNotFound|not found/i.test(error.message || '')) {
      throw error;
    }
  }
};

module.exports = {
  BUCKET_NAME,
  isPdfBuffer,
  uploadPdfBuffer,
  openPdfDownloadStream,
  deleteStoredPdf,
};
