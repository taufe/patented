const path = require('path');
const mongoose = require('mongoose');
const Course = require('../../models/Course');
const Book = require('../../models/Book');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { asBoolean } = require('../../utils/courseValidation');
const { toNumber } = require('../../utils/duration');
const { contentDisposition } = require('../../utils/pdfResponse');
const { sendHttpError } = require('../../utils/httpError');
const {
  isPdfBuffer,
  uploadPdfBuffer,
  openPdfDownloadStream,
  deleteStoredPdf,
} = require('../../services/pdfStorage.service');

const sanitizeFileName = (originalName = '') => {
  const base = path.basename(String(originalName).replace(/\\/g, '/'));
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, '_').trim();
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned || 'book'}.pdf`;
};

const storeBookPdf = async (file, meta = {}) => {
  if (!file || !file.buffer) {
    const error = new Error('PDF file is required');
    error.statusCode = 400;
    error.code = 'VALIDATION';
    throw error;
  }

  if (!isPdfBuffer(file.buffer)) {
    const error = new Error('Uploaded file is not a valid PDF');
    error.statusCode = 400;
    error.code = 'VALIDATION';
    throw error;
  }

  const originalFileName = sanitizeFileName(file.originalname);
  const storedFileName = `${new mongoose.Types.ObjectId()}-${originalFileName}`;
  const stored = await uploadPdfBuffer({
    buffer: file.buffer,
    filename: storedFileName,
    contentType: 'application/pdf',
    metadata: { kind: 'book', ...meta },
  });

  return {
    originalFileName,
    storedFileName: stored.storedFileName,
    storageKey: stored.storageKey,
    pdfUrl: stored.storageKey,
    fileSize: stored.fileSize || file.size || file.buffer.length,
    mimeType: 'application/pdf',
  };
};

const toAdminBook = (book) => {
  const value = book.toObject ? book.toObject() : { ...book };

  return {
    _id: value._id,
    courseId: value.courseId,
    title: value.title,
    originalFileName: value.originalFileName,
    fileSize: value.fileSize,
    mimeType: value.mimeType || 'application/pdf',
    totalPages: value.totalPages || 0,
    published: Boolean(value.published),
    downloadPath: `/api/admin/books/${value._id}/download`,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const streamBookPdf = (res, book) => {
  const storageKey = book.storageKey || book.pdfUrl;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDisposition(book.originalFileName || 'book.pdf'));
  if (book.fileSize) {
    res.setHeader('Content-Length', book.fileSize);
  }
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const downloadStream = openPdfDownloadStream(storageKey);

  downloadStream.on('error', (error) => {
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server error while downloading book',
        error: error.message,
      });
    }

    res.destroy(error);
  });

  downloadStream.pipe(res);
};

const loadCourseOr404 = async (res, courseId) => {
  if (!isValidId(courseId)) {
    invalidIdResponse(res, 'course ID');
    return null;
  }

  const course = await Course.findById(courseId);

  if (!course) {
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Course not found',
    });
    return null;
  }

  return course;
};

const listBooks = async (req, res) => {
  try {
    const course = await loadCourseOr404(res, req.params.courseId);

    if (!course) {
      return;
    }

    const books = await Book.find({ courseId: course._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Books fetched',
      books: books.map(toAdminBook),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching books');
  }
};

const createBook = async (req, res) => {
  let stored = null;

  try {
    const course = await loadCourseOr404(res, req.params.courseId);

    if (!course) {
      return;
    }

    const title = req.body.title == null ? '' : String(req.body.title).trim();

    if (!title) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION',
        message: 'Title is required',
      });
    }

    stored = await storeBookPdf(req.file, { courseId: String(course._id) });

    const book = await Book.create({
      courseId: course._id,
      title,
      published: asBoolean(req.body.published, true),
      totalPages: Math.max(0, toNumber(req.body.totalPages, 0)),
      uploadedBy: req.user._id,
      ...stored,
    });

    res.status(201).json({
      success: true,
      message: 'Book uploaded',
      book: toAdminBook(book),
    });
  } catch (error) {
    if (stored && stored.storageKey) {
      await deleteStoredPdf(stored.storageKey).catch(() => {});
    }

    sendHttpError(res, error, 'Server error while uploading book');
  }
};

const updateBook = async (req, res) => {
  let stored = null;

  try {
    const { bookId } = req.params;

    if (!isValidId(bookId)) {
      return invalidIdResponse(res, 'book ID');
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Book not found',
      });
    }

    if (req.body.title !== undefined) {
      const title = String(req.body.title || '').trim();

      if (!title) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION',
          message: 'Title is required',
        });
      }

      book.title = title;
    }

    if (req.body.published !== undefined) {
      book.published = asBoolean(req.body.published, book.published);
    }

    if (req.body.totalPages !== undefined) {
      book.totalPages = Math.max(0, toNumber(req.body.totalPages, book.totalPages));
    }

    if (req.file) {
      stored = await storeBookPdf(req.file, { courseId: String(book.courseId) });
      const previousKey = book.storageKey || book.pdfUrl;
      Object.assign(book, stored);
      if (previousKey) {
        await deleteStoredPdf(previousKey).catch(() => {});
      }
    }

    await book.save();

    res.json({
      success: true,
      message: 'Book updated',
      book: toAdminBook(book),
    });
  } catch (error) {
    if (stored && stored.storageKey) {
      await deleteStoredPdf(stored.storageKey).catch(() => {});
    }

    sendHttpError(res, error, 'Server error while updating book');
  }
};

const deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidId(bookId)) {
      return invalidIdResponse(res, 'book ID');
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Book not found',
      });
    }

    await deleteStoredPdf(book.storageKey || book.pdfUrl);
    await Book.deleteOne({ _id: bookId });

    res.json({
      success: true,
      message: 'Book deleted',
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while deleting book');
  }
};

const downloadBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!isValidId(bookId)) {
      return invalidIdResponse(res, 'book ID');
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Book not found',
      });
    }

    streamBookPdf(res, book);
  } catch (error) {
    sendHttpError(res, error, 'Server error while downloading book');
  }
};

module.exports = {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  downloadBook,
  toAdminBook,
  streamBookPdf,
};
