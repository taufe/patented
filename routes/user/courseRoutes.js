const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  listCourses,
  getCourse,
  listChapters,
  getChapter,
  getVideo,
} = require('../../controllers/user/courseController');
const {
  saveProgress,
  getProgress,
  continueWatching,
  watchHistory,
} = require('../../controllers/user/progressController');

const router = express.Router();

router.use(protect);

router.get('/courses', listCourses);
router.get('/courses/:courseId', getCourse);
router.get('/courses/:courseId/chapters', listChapters);
router.get('/courses/:courseId/chapters/:chapterId', getChapter);

router.get('/videos/:videoId', getVideo);
router.get('/videos/:videoId/progress', getProgress);
router.post('/videos/:videoId/progress', saveProgress);

router.get('/me/continue-watching', continueWatching);
router.get('/me/watch-history', watchHistory);

module.exports = router;
