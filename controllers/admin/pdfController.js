const path = require('path');
const mongoose = require('mongoose');
const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const Pdf = require('../../models/Pdf');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toNumber } = require('../../utils/duration');
const { toAdminPdf, contentDisposition } = require('../../utils/pdfResponse');
const {
  asBoolean,
  validatePdfPayload,
  titleFromFileName,
} = require('../../utils/courseValidation');
const {
  isPdfBuffer,
  uploadPdfBuffer,
  openPdfDownloadStream,
  deleteStoredPdf,
} = require('../../services/pdfStorage.service');

const sanitizeFileName = (originalName = '') => {
  const base = path.basename(String(originalName).replace(/\\/g, '/'));
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, '_').trim();
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned || 'material'}.pdf`;
};

const nextPdfOrder = async (query) => {
  const last = await Pdf.findOne(query).sort({ order: -1 }).select('order');
  return last ? last.order + 1 : 0;
};

const storeUploadedPdf = async (file, meta = {}) => {
  if (!file || !file.buffer) {
    const error = new Error('PDF file is required');
    error.statusCode = 400;
    throw error;
  }

  if (!isPdfBuffer(file.buffer)) {
    const error = new Error('Uploaded file is not a valid PDF');
    error.statusCode = 400;
    throw error;
  }

  const originalFileName = sanitizeFileName(file.originalname);
  const storedFileName = `${new mongoose.Types.ObjectId()}-${originalFileName}`;

  const stored = await uploadPdfBuffer({
    buffer: file.buffer,
    filename: storedFileName,
    contentType: 'application/pdf',
    metadata: meta,
  });

  return {
    originalFileName,
    storedFileName: stored.storedFileName,
    storageKey: stored.storageKey,
    storageProvider: 'gridfs',
    fileSize: stored.fileSize || file.size || file.buffer.length,
    mimeType: 'application/pdf',
  };
};

const pickPdfFields = (body, { isCreate, originalFileName } = {}) => {
  const payload = {};

  if (isCreate || body.title !== undefined) {
    const title =
      body.title == null || !String(body.title).trim()
        ? titleFromFileName(originalFileName)
        : String(body.title).trim();
    payload.title = title;
  }

  if (isCreate || body.kind !== undefined) {
    payload.kind = body.kind && String(body.kind).trim() ? String(body.kind).trim() : 'notes';
  }

  if (isCreate || body.published !== undefined) {
    payload.published = asBoolean(body.published, true);
  }

  if (body.order !== undefined) {
    payload.order = toNumber(body.order, 0);
  }

  return payload;
};

const handlePdfError = (res, error, action) => {
  const status = error.statusCode || 500;
  return res.status(status).json({
    success: false,
    message:
      status >= 500 ? `Server error while ${action}` : error.message || `Failed to ${action}`,
    ...(status >= 500 ? { error: error.message } : {}),
  });
};

const listPdfs = async (req, res, query, missingMessage) => {
  const pdfs = await Pdf.find(query).sort({ order: 1, createdAt: 1 });

  res.json({
    success: true,
    message: pdfs.length ? 'PDFs fetched successfully' : missingMessage,
    pdfs: pdfs.map(toAdminPdf),
  });
};

const listCoursePdfs = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    await listPdfs(req, res, { courseId, scope: 'course' }, 'No PDF attached');
  } catch (error) {
    handlePdfError(res, error, 'fetching PDFs');
  }
};

const createCoursePdf = async (req, res) => {
  let stored = null;

  try {
    const { courseId } = req.params;

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const validationError = validatePdfPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    stored = await storeUploadedPdf(req.file, { courseId, scope: 'course' });
    const fields = pickPdfFields(req.body, {
      isCreate: true,
      originalFileName: stored.originalFileName,
    });
    const order =
      fields.order === undefined ? await nextPdfOrder({ courseId, scope: 'course' }) : fields.order;

    const pdf = await Pdf.create({
      courseId,
      chapterId: null,
      videoId: null,
      scope: 'course',
      ...fields,
      order,
      ...stored,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully',
      pdf: toAdminPdf(pdf),
    });
  } catch (error) {
    if (stored) {
      await deleteStoredPdf(stored.storageKey).catch(() => {});
    }

    handlePdfError(res, error, 'uploading PDF');
  }
};

const listChapterPdfs = async (req, res) => {
  try {
    const { chapterId } = req.params;

    if (!isValidId(chapterId)) {
      return invalidIdResponse(res, 'chapter ID');
    }

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    await listPdfs(req, res, { chapterId, scope: 'chapter' }, 'No PDF attached');
  } catch (error) {
    handlePdfError(res, error, 'fetching PDFs');
  }
};

const createChapterPdf = async (req, res) => {
  let stored = null;

  try {
    const { chapterId } = req.params;

    if (!isValidId(chapterId)) {
      return invalidIdResponse(res, 'chapter ID');
    }

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const validationError = validatePdfPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    stored = await storeUploadedPdf(req.file, {
      courseId: chapter.courseId,
      chapterId,
      scope: 'chapter',
    });
    const fields = pickPdfFields(req.body, {
      isCreate: true,
      originalFileName: stored.originalFileName,
    });
    const order =
      fields.order === undefined
        ? await nextPdfOrder({ chapterId, scope: 'chapter' })
        : fields.order;

    const pdf = await Pdf.create({
      courseId: chapter.courseId,
      chapterId,
      videoId: null,
      scope: 'chapter',
      ...fields,
      order,
      ...stored,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully',
      pdf: toAdminPdf(pdf),
    });
  } catch (error) {
    if (stored) {
      await deleteStoredPdf(stored.storageKey).catch(() => {});
    }

    handlePdfError(res, error, 'uploading PDF');
  }
};

const listVideoPdfs = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!isValidId(videoId)) {
      return invalidIdResponse(res, 'video ID');
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    await listPdfs(req, res, { videoId, scope: 'lecture' }, 'No PDF attached');
  } catch (error) {
    handlePdfError(res, error, 'fetching PDFs');
  }
};

const createVideoPdf = async (req, res) => {
  let stored = null;

  try {
    const { videoId } = req.params;

    if (!isValidId(videoId)) {
      return invalidIdResponse(res, 'video ID');
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const validationError = validatePdfPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    stored = await storeUploadedPdf(req.file, {
      courseId: video.courseId,
      chapterId: video.chapterId,
      videoId,
      scope: 'lecture',
    });
    const fields = pickPdfFields(req.body, {
      isCreate: true,
      originalFileName: stored.originalFileName,
    });
    const order =
      fields.order === undefined
        ? await nextPdfOrder({ videoId, scope: 'lecture' })
        : fields.order;

    const pdf = await Pdf.create({
      courseId: video.courseId,
      chapterId: video.chapterId,
      videoId,
      scope: 'lecture',
      ...fields,
      order,
      ...stored,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully',
      pdf: toAdminPdf(pdf),
    });
  } catch (error) {
    if (stored) {
      await deleteStoredPdf(stored.storageKey).catch(() => {});
    }

    handlePdfError(res, error, 'uploading PDF');
  }
};

const getPdf = async (req, res) => {
  try {
    const { pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const pdf = await Pdf.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    res.json({
      success: true,
      message: 'PDF fetched successfully',
      pdf: toAdminPdf(pdf),
    });
  } catch (error) {
    handlePdfError(res, error, 'fetching PDF');
  }
};

const updatePdf = async (req, res) => {
  let stored = null;

  try {
    const { pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const existing = await Pdf.findById(pdfId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    const validationError = validatePdfPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const updates = pickPdfFields(req.body, {
      originalFileName: existing.originalFileName,
    });

    if (req.file) {
      stored = await storeUploadedPdf(req.file, {
        courseId: existing.courseId,
        chapterId: existing.chapterId,
        videoId: existing.videoId,
        scope: existing.scope,
      });
      Object.assign(updates, stored);
    }

    const pdf = await Pdf.findByIdAndUpdate(pdfId, updates, {
      new: true,
      runValidators: true,
    });

    if (stored) {
      await deleteStoredPdf(existing.storageKey).catch(() => {});
    }

    res.json({
      success: true,
      message: stored ? 'PDF replaced successfully' : 'PDF updated successfully',
      pdf: toAdminPdf(pdf),
    });
  } catch (error) {
    if (stored) {
      await deleteStoredPdf(stored.storageKey).catch(() => {});
    }

    handlePdfError(res, error, 'updating PDF');
  }
};

const deletePdf = async (req, res) => {
  try {
    const { pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const pdf = await Pdf.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
    }

    await deleteStoredPdf(pdf.storageKey);
    await Pdf.deleteOne({ _id: pdfId });

    res.json({
      success: true,
      message: 'PDF deleted successfully',
    });
  } catch (error) {
    handlePdfError(res, error, 'deleting PDF');
  }
};

const downloadPdf = async (req, res) => {
  try {
    const { pdfId } = req.params;

    if (!isValidId(pdfId)) {
      return invalidIdResponse(res, 'PDF ID');
    }

    const pdf = await Pdf.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found',
      });
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
  } catch (error) {
    handlePdfError(res, error, 'downloading PDF');
  }
};

module.exports = {
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
};
