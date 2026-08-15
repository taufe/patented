const User = require('../../models/User');
const Course = require('../../models/Course');
const VideoProgress = require('../../models/VideoProgress');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toPublicUser } = require('../../utils/userResponse');
const { asBoolean } = require('../../utils/courseValidation');
const { getPagination, paginationMeta } = require('../../utils/pagination');

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
    unlockedCourses: (value.unlockedCourses || []).map((item) =>
      item && item._id ? String(item._id) : String(item)
    ),
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

    const user = await User.findById(req.params.userId).populate(
      'unlockedCourses',
      'title status'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User fetched successfully',
      user: {
        ...toPublicUser(user),
        unlockedCourses: (user.unlockedCourses || []).map((course) => ({
          _id: course._id,
          title: course.title,
          status: course.status,
        })),
      },
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

const updateCourseAccess = async (req, res) => {
  try {
    const { courseId, unlocked } = req.body;

    if (!courseId || unlocked === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId and unlocked',
      });
    }

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const user = await getUserOr404(res, req.params.userId);

    if (!user) {
      return;
    }

    const course = await Course.findById(courseId).select('title status');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const shouldUnlock = asBoolean(unlocked, false);
    const currentIds = (user.unlockedCourses || []).map((id) => String(id));

    if (shouldUnlock) {
      if (!currentIds.includes(String(courseId))) {
        user.unlockedCourses.push(course._id);
      }
    } else {
      user.unlockedCourses = user.unlockedCourses.filter(
        (id) => String(id) !== String(courseId)
      );
    }

    await user.save();
    await user.populate('unlockedCourses', 'title status');

    res.json({
      success: true,
      message: 'Course access updated successfully',
      user: {
        ...toPublicUser(user),
        unlockedCourses: (user.unlockedCourses || []).map((item) => ({
          _id: item._id,
          title: item.title,
          status: item.status,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating course access',
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
};
