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
const {
  listCoursePdfs,
  getCoursePdf,
  downloadCoursePdf,
  listChapterPdfs,
  getChapterPdf,
  downloadChapterPdf,
  listVideoPdfs,
  getVideoPdf,
  downloadVideoPdf,
} = require('../../controllers/user/pdfController');

const router = express.Router();

router.use(protect);

router.get('/courses', listCourses);
router.get('/courses/:courseId', getCourse);
router.get('/courses/:courseId/pdfs', listCoursePdfs);
router.get('/courses/:courseId/pdfs/:pdfId/download', downloadCoursePdf);
router.get('/courses/:courseId/pdfs/:pdfId', getCoursePdf);
router.get('/courses/:courseId/chapters', listChapters);
router.get('/courses/:courseId/chapters/:chapterId/pdfs', listChapterPdfs);
router.get('/courses/:courseId/chapters/:chapterId/pdfs/:pdfId/download', downloadChapterPdf);
router.get('/courses/:courseId/chapters/:chapterId/pdfs/:pdfId', getChapterPdf);
router.get('/courses/:courseId/chapters/:chapterId', getChapter);

router.get('/videos/:videoId/pdfs', listVideoPdfs);
router.get('/videos/:videoId/pdfs/:pdfId/download', downloadVideoPdf);
router.get('/videos/:videoId/pdfs/:pdfId', getVideoPdf);
router.get('/videos/:videoId', getVideo);
router.get('/videos/:videoId/progress', getProgress);
router.post('/videos/:videoId/progress', saveProgress);

router.get('/me/continue-watching', continueWatching);
router.get('/me/watch-history', watchHistory);

module.exports = router;
