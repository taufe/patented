const User = require('../../models/User');
const { isValidId } = require('../../utils/ids');
const { toPublicUser } = require('../../utils/userResponse');
const { isAllowedImage } = require('../../utils/imageSignature');
const { INVALID_PHOTO_MESSAGE } = require('../../middleware/uploadPhoto');
const {
  storeProfilePhoto,
  deleteProfilePhotos,
  findLatestProfilePhoto,
  openPhotoDownloadStream,
  buildProfilePhotoUrl,
} = require('../../services/photoStorage.service');

const STORAGE_FAILURE_MESSAGE = 'Unable to upload profile photo. Please try again.';

const saveUserPhotoUrl = async (userId, photoUrl, updatedAt = new Date()) =>
  User.findByIdAndUpdate(
    userId,
    {
      photoUrl,
      updatedAt,
    },
    {
      new: true,
      runValidators: true,
      timestamps: true,
    }
  );

const uploadMePhoto = async (req, res) => {
  try {
    const detected = isAllowedImage(req.photoFile);

    if (!detected) {
      return res.status(400).json({
        success: false,
        message: INVALID_PHOTO_MESSAGE,
      });
    }

    const userId = String(req.user._id);

    await storeProfilePhoto({
      userId,
      buffer: req.photoFile.buffer,
      contentType: detected.mime,
      ext: detected.ext,
    });

    const updatedAt = new Date();
    const user = await saveUserPhotoUrl(
      userId,
      buildProfilePhotoUrl(req, userId, updatedAt.getTime()),
      updatedAt
    );

    return res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error(`Profile photo upload failed: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: STORAGE_FAILURE_MESSAGE,
    });
  }
};

const deleteMePhoto = async (req, res) => {
  try {
    const userId = String(req.user._id);

    const user = await saveUserPhotoUrl(userId, '');
    await deleteProfilePhotos(userId);

    return res.json({
      success: true,
      message: 'Profile photo removed successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: STORAGE_FAILURE_MESSAGE,
    });
  }
};

const streamPublicPhoto = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(404).json({
        success: false,
        message: 'Profile photo not found',
      });
    }

    const file = await findLatestProfilePhoto(userId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Profile photo not found',
      });
    }

    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');

    if (file.uploadDate) {
      res.setHeader('Last-Modified', new Date(file.uploadDate).toUTCString());
    }

    const downloadStream = openPhotoDownloadStream(file._id);

    downloadStream.on('error', (error) => {
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: STORAGE_FAILURE_MESSAGE,
        });
      }

      res.destroy(error);
    });

    downloadStream.pipe(res);
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: STORAGE_FAILURE_MESSAGE,
      });
    }

    res.destroy(error);
  }
};

module.exports = {
  uploadMePhoto,
  deleteMePhoto,
  streamPublicPhoto,
};
