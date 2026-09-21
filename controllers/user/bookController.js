const Course = require('../../models/Course');
const Book = require('../../models/Book');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { hasCourseAccess, sendCourseLocked } = require('../../utils/subscription');
const { sendHttpError } = require('../../utils/httpError');
const { streamBookPdf } = require('../admin/bookController');

const toPublicBook = (book) => {
  const value = book.toObject ? book.toObject() : { ...book };

  return {
    _id: value._id,
    courseId: value.courseId,
    title: value.title,
    totalPages: value.totalPages || 0,
    published: Boolean(value.published),
    fileSize: value.fileSize,
    mimeType: value.mimeType || 'application/pdf',
    available: true,
    isLocked: false,
    downloadPath: `/api/courses/${value.courseId}/books/${value._id}/download`,
    createdAt: value.createdAt,
  };
};

const loadPublishedCourse = async (res, courseId) => {
  if (!isValidId(courseId)) {
    invalidIdResponse(res, 'course ID');
    return null;
  }

  const course = await Course.findOne({ _id: courseId, status: 'Published' });

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
    const course = await loadPublishedCourse(res, req.params.courseId);

    if (!course) {
      return;
    }

    if (!hasCourseAccess(req.user, course._id)) {
      return res.json({
        success: true,
        message: 'Course locked',
        isLocked: true,
        books: [],
      });
    }

    const books = await Book.find({ courseId: course._id, published: true }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      message: 'Books fetched',
      isLocked: false,
      books: books.map(toPublicBook),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching books');
  }
};

const getBook = async (req, res) => {
  try {
    const { courseId, bookId } = req.params;

    if (!isValidId(bookId)) {
      return invalidIdResponse(res, 'book ID');
    }

    const course = await loadPublishedCourse(res, courseId);

    if (!course) {
      return;
    }

    if (!hasCourseAccess(req.user, course._id)) {
      return sendCourseLocked(res);
    }

    const book = await Book.findOne({ _id: bookId, courseId: course._id });

    if (!book || !book.published) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      message: 'Book fetched',
      isLocked: false,
      book: toPublicBook(book),
    });
  } catch (error) {
    sendHttpError(res, error, 'Server error while fetching book');
  }
};

const downloadBook = async (req, res) => {
  try {
    const { courseId, bookId } = req.params;

    if (!isValidId(bookId)) {
      return invalidIdResponse(res, 'book ID');
    }

    const course = await loadPublishedCourse(res, courseId);

    if (!course) {
      return;
    }

    if (!hasCourseAccess(req.user, course._id)) {
      return sendCourseLocked(res);
    }

    const book = await Book.findOne({ _id: bookId, courseId: course._id });

    if (!book || !book.published) {
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
  getBook,
  downloadBook,
};
