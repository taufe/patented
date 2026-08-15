const User = require('../../models/User');
const { toPublicUser } = require('../../utils/userResponse');
const { asBoolean } = require('../../utils/courseValidation');

const PROFILE_FIELDS = [
  'name',
  'phone',
  'country',
  'dateOfBirth',
  'department',
  'designation',
  'about',
  'photoUrl',
];

const SETTING_FIELDS = ['emailNotification', 'pushNotification', 'marketingEmails', 'biometricLogin'];

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      message: 'Profile fetched successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message,
    });
  }
};

const updateMe = async (req, res) => {
  try {
    const updates = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty',
        });
      }

      updates.name = name;
    }

    PROFILE_FIELDS.filter((field) => field !== 'name').forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field] == null ? '' : String(req.body[field]).trim();
      }
    });

    SETTING_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = asBoolean(req.body[field], false);
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message,
    });
  }
};

module.exports = {
  getMe,
  updateMe,
};
