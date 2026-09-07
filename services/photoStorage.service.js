const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const { getPublicBaseUrl } = require('../config/env');

const BUCKET_NAME = 'profile_photos';

const getBucket = () => {
  const db = mongoose.connection.db;

  if (!db) {
    const error = new Error('Database not connected');
    error.statusCode = 500;
    throw error;
  }

  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
};

const toObjectId = (id) => {
  try {
    return new ObjectId(String(id));
  } catch (error) {
    const invalid = new Error('Invalid storage key');
    invalid.statusCode = 500;
    throw invalid;
  }
};

const findProfilePhotoFiles = async (userId) => {
  if (!userId) {
    return [];
  }

  return getBucket()
    .find({ 'metadata.userId': String(userId) })
    .sort({ uploadDate: -1 })
    .toArray();
};

const findLatestProfilePhoto = async (userId) => {
  const files = await findProfilePhotoFiles(userId);
  return files[0] || null;
};

const deleteProfilePhotos = async (userId, { exceptId } = {}) => {
  if (!userId) {
    return;
  }

  const bucket = getBucket();
  const files = await findProfilePhotoFiles(userId);
  const skip = exceptId ? String(exceptId) : '';

  await Promise.all(
    files
      .filter((file) => String(file._id) !== skip)
      .map(async (file) => {
        try {
          await bucket.delete(file._id);
        } catch (error) {
          if (!/FileNotFound|not found/i.test(error.message || '')) {
            throw error;
          }
        }
      })
  );
};

const uploadPhotoBuffer = ({ buffer, filename, contentType, metadata = {} }) =>
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
        contentType,
      });
    };

    uploadStream.once('error', fail);
    uploadStream.once('finish', succeed);
    uploadStream.end(buffer);
  });

const storeProfilePhoto = async ({ userId, buffer, contentType, ext }) => {
  const filename = `users/${userId}/profile.${ext}`;
  const stored = await uploadPhotoBuffer({
    buffer,
    filename,
    contentType,
    metadata: {
      userId: String(userId),
      kind: 'profile',
    },
  });

  await deleteProfilePhotos(userId, { exceptId: stored.storageKey });

  return stored;
};

const openPhotoDownloadStream = (storageKey) =>
  getBucket().openDownloadStream(toObjectId(storageKey));

const buildProfilePhotoUrl = (req, userId, version) => {
  const url = `${getPublicBaseUrl(req)}/api/public/photos/${userId}`;
  return version ? `${url}?v=${encodeURIComponent(String(version))}` : url;
};

const isManagedProfilePhotoUrl = (photoUrl, userId) => {
  if (!photoUrl || !userId) {
    return false;
  }

  try {
    const parsed = new URL(String(photoUrl));
    const path = parsed.pathname.replace(/\/$/, '');
    return path === `/api/public/photos/${userId}`;
  } catch (error) {
    return false;
  }
};

module.exports = {
  BUCKET_NAME,
  findLatestProfilePhoto,
  deleteProfilePhotos,
  storeProfilePhoto,
  openPhotoDownloadStream,
  buildProfilePhotoUrl,
  isManagedProfilePhotoUrl,
};
