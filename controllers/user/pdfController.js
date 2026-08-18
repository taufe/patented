const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const Pdf = require('../../models/Pdf');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toPublicPdf, contentDisposition } = require('../../utils/pdfResponse');
const { isPdfLocked } = require('../../utils/subscription');
const { openPdfDownloadStream } = require('../../services/pdfStorage.service');

const PUBLISHED_COURSE = { status: 'Published' };

const handlePdfError = (res, error, action) => {
  const status = error.statusCode || 500;
  return res.status(status).json({
    success: false,
    message:
      status >= 500 ? `Server error while ${action}` : error.message || `Failed to ${action}`,
    ...(status >= 500 ? { error: error.message } : {}),
  });
};

const idsMatch = (left, right) => {
  if (!left || !right) {
    return false;
  }

  return String(left) === String(right);
};

const loadPublishedCourse = async (courseId) => {
  if (!isValidId(courseId)) {
    return { status: 400, message: 'Invalid course ID' };
  }

  const course = await Course.findOne({ _id: courseId, ...PUBLISHED_COURSE });

  if (!course) {
    return { status: 404, message: 'Course not found' };
  }

  return { course };
};

const loadPublishedChapter = async (courseId, chapterId) => {
  const courseResult = await loadPublishedCourse(courseId);

  if (courseResult.status) {
    return courseResult;
  }

  if (!isValidId(chapterId)) {
    return { status: 400, message: 'Invalid chapter ID' };
  }

  const chapter = await Chapter.findOne({
    _id: chapterId,
    courseId,
    published: true,
  });

  if (!chapter) {
    return { status: 404, message: 'Chapter not found' };
  }

  return { course: courseResult.course, chapter };
};

const loadPublishedVideo = async (videoId) => {
  if (!isValidId(videoId)) {
    return { status: 400, message: 'Invalid video ID' };
  }

  const video = await Video.findById(videoId);

  if (!video || !video.published) {
    return { status: 404, message: 'Video not found' };
  }

  const [course, chapter] = await Promise.all([
    Course.findById(video.courseId),
    Chapter.findById(video.chapterId),
  ]);

  if (!course || course.status !== 'Published' || !chapter || !chapter.published) {
    return { status: 404, message: 'Video not found' };
  }

  return { course, chapter, video };
};

const forbiddenPdf = (res, pdf, locked) =>
  res.status(403).json({
    success: false,
    message: 'Premium subscription required',
    pdf: toPublicPdf(pdf, { locked }),
  });

const emptyPdfs = (res, message = 'No PDF attached') =>
  res.json({
    success: true,
    message,
    pdf: null,
    pdfs: [],
  });

const listCoursePdfs = async (req, res) => {
  try {
    const loaded = await loadPublishedCourse(req.params.courseId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdfs = await Pdf.find({
      courseId: loaded.course._id,
      scope: 'course',
      published: true,
    }).sort({ order: 1, createdAt: 1 });

    if (pdfs.length === 0) {
      return emptyPdfs(res);
    }

    const locked = isPdfLocked(pdfs[0], req.user, loaded.course);
    const publicPdfs = pdfs.map((pdf) => toPublicPdf(pdf, { locked }));

    res.json({
      success: true,
      message: 'PDFs fetched successfully',
      pdf: publicPdfs[0],
      pdfs: publicPdfs,
    });
  } catch (error) {
    handlePdfError(res, error, 'fetching PDFs');
  }
};

const getCoursePdf = async (req, res) => {
  try {
    const { courseId, pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const loaded = await loadPublishedCourse(courseId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdf = await Pdf.findOne({
      _id: pdfId,
      courseId,
      scope: 'course',
      published: true,
    });

    if (!pdf || !idsMatch(pdf.courseId, courseId)) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    const locked = isPdfLocked(pdf, req.user, loaded.course);

    if (locked) {
      return forbiddenPdf(res, pdf, true);
    }

    res.json({
      success: true,
      message: 'PDF fetched successfully',
      pdf: toPublicPdf(pdf, { locked: false }),
    });
  } catch (error) {
    handlePdfError(res, error, 'fetching PDF');
  }
};

const listChapterPdfs = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const loaded = await loadPublishedChapter(courseId, chapterId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdfs = await Pdf.find({
      courseId,
      chapterId,
      scope: 'chapter',
      published: true,
    }).sort({ order: 1, createdAt: 1 });

    if (pdfs.length === 0) {
      return emptyPdfs(res);
    }

    const locked = isPdfLocked(pdfs[0], req.user, loaded.course);
    const publicPdfs = pdfs.map((pdf) => toPublicPdf(pdf, { locked }));

    res.json({
      success: true,
      message: 'PDFs fetched successfully',
      pdf: publicPdfs[0],
      pdfs: publicPdfs,
    });
  } catch (error) {
    handlePdfError(res, error, 'fetching PDFs');
  }
};

const getChapterPdf = async (req, res) => {
  try {
    const { courseId, chapterId, pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const loaded = await loadPublishedChapter(courseId, chapterId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdf = await Pdf.findOne({
      _id: pdfId,
      courseId,
      chapterId,
      scope: 'chapter',
      published: true,
    });

    if (
      !pdf ||
      !idsMatch(pdf.courseId, courseId) ||
      !idsMatch(pdf.chapterId, chapterId)
    ) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    const locked = isPdfLocked(pdf, req.user, loaded.course);

    if (locked) {
      return forbiddenPdf(res, pdf, true);
    }

    res.json({
      success: true,
      message: 'PDF fetched successfully',
      pdf: toPublicPdf(pdf, { locked: false }),
    });
  } catch (error) {
    handlePdfError(res, error, 'fetching PDF');
  }
};

const listVideoPdfs = async (req, res) => {
  try {
    const loaded = await loadPublishedVideo(req.params.videoId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdfs = await Pdf.find({
      videoId: loaded.video._id,
      scope: 'lecture',
      published: true,
    }).sort({ order: 1, createdAt: 1 });

    if (pdfs.length === 0) {
      return emptyPdfs(res);
    }

    const locked = isPdfLocked(pdfs[0], req.user, loaded.course, loaded.video);
    const publicPdfs = pdfs.map((pdf) => toPublicPdf(pdf, { locked }));

    res.json({
      success: true,
      message: 'PDFs fetched successfully',
      pdf: publicPdfs[0],
      pdfs: publicPdfs,
    });
  } catch (error) {
    handlePdfError(res, error, 'fetching PDFs');
  }
};

const getVideoPdf = async (req, res) => {
  try {
    const { videoId, pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const loaded = await loadPublishedVideo(videoId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdf = await Pdf.findOne({
      _id: pdfId,
      videoId,
      scope: 'lecture',
      published: true,
    });

    if (!pdf || !idsMatch(pdf.videoId, videoId) || !idsMatch(pdf.courseId, loaded.course._id)) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    const locked = isPdfLocked(pdf, req.user, loaded.course, loaded.video);

    if (locked) {
      return forbiddenPdf(res, pdf, true);
    }

    res.json({
      success: true,
      message: 'PDF fetched successfully',
      pdf: toPublicPdf(pdf, { locked: false }),
    });
  } catch (error) {
    handlePdfError(res, error, 'fetching PDF');
  }
};

const streamAuthorizedPdf = async (req, res, pdf, course, video = null) => {
  const locked = isPdfLocked(pdf, req.user, course, video);

  if (locked) {
    return forbiddenPdf(res, pdf, true);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDisposition(pdf.originalFileName));
  res.setHeader('Content-Length', pdf.fileSize);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const downloadStream = openPdfDownloadStream(pdf.storageKey);

  downloadStream.on('error', (error) => {
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server error while downloading PDF',
        error: error.message,
      });
    }

    res.destroy(error);
  });

  downloadStream.pipe(res);
};

const downloadCoursePdf = async (req, res) => {
  try {
    const { courseId, pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const loaded = await loadPublishedCourse(courseId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdf = await Pdf.findOne({
      _id: pdfId,
      courseId,
      scope: 'course',
      published: true,
    });

    if (!pdf || !idsMatch(pdf.courseId, courseId)) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    await streamAuthorizedPdf(req, res, pdf, loaded.course);
  } catch (error) {
    handlePdfError(res, error, 'downloading PDF');
  }
};

const downloadChapterPdf = async (req, res) => {
  try {
    const { courseId, chapterId, pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const loaded = await loadPublishedChapter(courseId, chapterId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdf = await Pdf.findOne({
      _id: pdfId,
      courseId,
      chapterId,
      scope: 'chapter',
      published: true,
    });

    if (
      !pdf ||
      !idsMatch(pdf.courseId, courseId) ||
      !idsMatch(pdf.chapterId, chapterId)
    ) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    await streamAuthorizedPdf(req, res, pdf, loaded.course);
  } catch (error) {
    handlePdfError(res, error, 'downloading PDF');
  }
};

const downloadVideoPdf = async (req, res) => {
  try {
    const { videoId, pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const loaded = await loadPublishedVideo(videoId);

    if (loaded.status) {
      return res.status(loaded.status).json({
        success: false,
        message: loaded.message,
      });
    }

    const pdf = await Pdf.findOne({
      _id: pdfId,
      videoId,
      scope: 'lecture',
      published: true,
    });

    if (!pdf || !idsMatch(pdf.videoId, videoId) || !idsMatch(pdf.courseId, loaded.course._id)) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    await streamAuthorizedPdf(req, res, pdf, loaded.course, loaded.video);
  } catch (error) {
    handlePdfError(res, error, 'downloading PDF');
  }
};

module.exports = {
  listCoursePdfs,
  getCoursePdf,
  downloadCoursePdf,
  listChapterPdfs,
  getChapterPdf,
  downloadChapterPdf,
  listVideoPdfs,
  getVideoPdf,
  downloadVideoPdf,
};
