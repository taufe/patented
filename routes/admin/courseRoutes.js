const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
} = require('../../controllers/admin/courseController');
const {
  listChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
} = require('../../controllers/admin/chapterController');
const {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
} = require('../../controllers/admin/videoController');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/courses', listCourses);
router.patch('/courses/reorder', reorderCourses);
router.post('/courses', createCourse);
router.get('/courses/:courseId', getCourse);
router.patch('/courses/:courseId', updateCourse);
router.delete('/courses/:courseId', deleteCourse);

router.get('/courses/:courseId/chapters', listChapters);
router.patch('/courses/:courseId/chapters/reorder', reorderChapters);
router.post('/courses/:courseId/chapters', createChapter);

router.patch('/chapters/:chapterId', updateChapter);
router.delete('/chapters/:chapterId', deleteChapter);

router.get('/chapters/:chapterId/videos', listVideos);
router.patch('/chapters/:chapterId/videos/reorder', reorderVideos);
router.post('/chapters/:chapterId/videos', createVideo);

router.patch('/videos/:videoId', updateVideo);
router.delete('/videos/:videoId', deleteVideo);

module.exports = router;
