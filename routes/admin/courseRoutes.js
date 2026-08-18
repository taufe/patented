const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
  listCourseOptions,
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
const {
  listCoursePdfs,
  createCoursePdf,
  listChapterPdfs,
  createChapterPdf,
  listVideoPdfs,
  createVideoPdf,
  getPdf,
  updatePdf,
  deletePdf,
  downloadPdf,
} = require('../../controllers/admin/pdfController');
const { uploadPdf } = require('../../middleware/uploadPdf');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/courses', listCourses);
router.get('/courses/options', listCourseOptions);
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

router.get('/courses/:courseId/pdfs', listCoursePdfs);
router.post('/courses/:courseId/pdfs', uploadPdf({ required: true }), createCoursePdf);

router.get('/chapters/:chapterId/pdfs', listChapterPdfs);
router.post('/chapters/:chapterId/pdfs', uploadPdf({ required: true }), createChapterPdf);

router.get('/videos/:videoId/pdfs', listVideoPdfs);
router.post('/videos/:videoId/pdfs', uploadPdf({ required: true }), createVideoPdf);

router.get('/pdfs/:pdfId', getPdf);
router.get('/pdfs/:pdfId/download', downloadPdf);
router.patch('/pdfs/:pdfId', uploadPdf({ required: false }), updatePdf);
router.delete('/pdfs/:pdfId', deletePdf);

module.exports = router;
