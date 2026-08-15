const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  listUsers,
  getUser,
  blockUser,
  deleteUser,
  updateCourseAccess,
} = require('../../controllers/admin/userController');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/users', listUsers);
router.get('/users/:userId', getUser);
router.patch('/users/:userId/block', blockUser);
router.patch('/users/:userId/course-access', updateCourseAccess);
router.delete('/users/:userId', deleteUser);

module.exports = router;
