const User = require('../../models/User');
const Course = require('../../models/Course');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toPublicUser } = require('../../utils/userResponse');
const { asBoolean } = require('../../utils/courseValidation');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const { deleteProfilePhotos } = require('../../services/photoStorage.service');

const toUnlockedCourses = (courses) =>
  (courses || [])
    .filter(Boolean)
    .map((course) =>
      course && course.title
        ? {
            _id: course._id,
            title: course.title,
            status: course.status,
          }
        : { _id: course._id || course }
    );

const toUnlockedVideos = (videos) =>
  (videos || [])
    .filter(Boolean)
    .map((video) =>
      video && video.title
        ? {
            _id: video._id,
            title: video.title,
          }
        : { _id: video._id || video }
    );

const populateUserAccess = (query) =>
  query
    .populate('unlockedCourses', 'title status')
    .populate('unlockedVideos', 'title');

const toAccessUser = (user) => ({
  ...toPublicUser(user),
  unlockedCourses: toUnlockedCourses(user.unlockedCourses),
  unlockedVideos: toUnlockedVideos(user.unlockedVideos),
});

const getUserOr404 = async (res, userId) => {
  if (!isValidId(userId)) {
    invalidIdResponse(res, 'user ID');
    return null;
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return null;
  }

  return user;
};

const toListUser = (user) => {
  const value = toPublicUser(user);

  return {
    _id: value._id,
    name: value.name,
    email: value.email,
    photoUrl: value.photoUrl,
    role: value.role,
    isBlocked: value.isBlocked,
    emailVerified: value.emailVerified,
    isPremium: value.isPremium,
    joinedDate: value.joinedDate,
    lastLoginAt: value.lastLoginAt,
    lastDevice: value.lastDevice,
    unlockedCourses: value.unlockedCourses || [],
    unlockedVideos: value.unlockedVideos || [],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const listUsers = async (req, res) => {
  try {
    const { search, status, includeAdmins } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (includeAdmins !== 'true') {
      filter.role = 'user';
    }

    if (status === 'active') {
      filter.isBlocked = false;
    } else if (status === 'blocked') {
      filter.isBlocked = true;
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: 'Users fetched successfully',
      users: users.map(toListUser),
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message,
    });
  }
};

const getUser = async (req, res) => {
  try {
    if (!isValidId(req.params.userId)) {
      return invalidIdResponse(res, 'user ID');
    }

    const user = await populateUserAccess(User.findById(req.params.userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User fetched successfully',
      user: toAccessUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message,
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const user = await getUserOr404(res, req.params.userId);

    if (!user) {
      return;
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block an admin account',
      });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block your own account',
      });
    }

    if (req.body.isBlocked === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide isBlocked',
      });
    }

    user.isBlocked = asBoolean(req.body.isBlocked, false);
    await user.save();

    res.json({
      success: true,
      message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
      user: toListUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating block status',
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await getUserOr404(res, req.params.userId);

    if (!user) {
      return;
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an admin account',
      });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await VideoProgress.deleteMany({ userId: user._id });
    await deleteProfilePhotos(user._id);
    await User.deleteOne({ _id: user._id });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: error.message,
    });
  }
};

const toAccessIdList = (items) =>
  (items || [])
    .filter(Boolean)
    .map((item) => (item && item._id ? String(item._id) : String(item)));

const updateCourseAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const { courseId, unlocked } = req.body;

    if (!courseId || typeof unlocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId and unlocked',
      });
    }

    if (!isValidId(userId) || !isValidId(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user or course id',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update course access for an admin account',
      });
    }

    const course = await Course.findById(courseId).select('title status');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const update = unlocked
      ? { $addToSet: { unlockedCourses: course._id } }
      : { $pull: { unlockedCourses: course._id } };

    await User.updateOne({ _id: user._id }, update);

    let updated = await User.findById(user._id).select(
      'name email unlockedCourses unlockedVideos'
    );
    let unlockedCourses;
    let unlockedVideos;

    try {
      updated = await updated.populate([
        { path: 'unlockedCourses', select: 'title status' },
        { path: 'unlockedVideos', select: 'title' },
      ]);
      unlockedCourses = toUnlockedCourses(updated.unlockedCourses);
      unlockedVideos = toUnlockedVideos(updated.unlockedVideos);
    } catch (populateError) {
      console.error(populateError);
      unlockedCourses = toAccessIdList(updated.unlockedCourses);
      unlockedVideos = toAccessIdList(updated.unlockedVideos);
    }

    res.json({
      success: true,
      message: 'Course access updated successfully',
      user: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        unlockedCourses,
        unlockedVideos,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course access',
      error: error.message,
    });
  }
};

const updateVideoAccess = async (req, res) => {
  try {
    const { videoId, unlocked } = req.body;

    if (!videoId || unlocked === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide videoId and unlocked',
      });
    }

    if (!isValidId(videoId)) {
      return invalidIdResponse(res, 'video ID');
    }

    const user = await getUserOr404(res, req.params.userId);

    if (!user) {
      return;
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update video access for an admin account',
      });
    }

    const video = await Video.findById(videoId).select('title');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const shouldUnlock = asBoolean(unlocked, false);
    const currentIds = (user.unlockedVideos || []).map((id) => String(id));

    if (shouldUnlock) {
      if (!currentIds.includes(String(videoId))) {
        user.unlockedVideos.push(video._id);
      }
    } else {
      user.unlockedVideos = user.unlockedVideos.filter(
        (id) => String(id) !== String(videoId)
      );
    }

    await user.save();
    await populateUserAccess(user);

    res.json({
      success: true,
      message: 'Video access updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        unlockedCourses: toUnlockedCourses(user.unlockedCourses),
        unlockedVideos: toUnlockedVideos(user.unlockedVideos),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating video access',
      error: error.message,
    });
  }
};

module.exports = {
  listUsers,
  getUser,
  blockUser,
  deleteUser,
  updateCourseAccess,
  updateVideoAccess,
};
