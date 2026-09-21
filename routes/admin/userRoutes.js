const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  listUsers,
  getUser,
  blockUser,
  deleteUser,
  updateCourseAccess,
  updateVideoAccess,
} = require('../../controllers/admin/userController');
const { listUserAttempts } = require('../../controllers/admin/quizController');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/users', listUsers);
router.get('/users/:userId/quiz-attempts', listUserAttempts);
router.get('/users/:userId', getUser);
router.patch('/users/:userId/block', blockUser);
router.patch('/users/:userId/course-access', updateCourseAccess);
router.patch('/users/:userId/video-access', updateVideoAccess);
router.delete('/users/:userId', deleteUser);

module.exports = router;
