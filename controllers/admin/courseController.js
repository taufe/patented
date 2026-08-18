const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { deletePdfsAndFiles } = require('../../services/pdfCleanup.service');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toNumber } = require('../../utils/duration');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const {
  asBoolean,
  validateCoursePayload,
  validateOrderedIds,
} = require('../../utils/courseValidation');

const pickCourseFields = (body, { isCreate } = {}) => {
  const payload = {};

  if (isCreate || body.title !== undefined) {
    payload.title = String(body.title).trim();
  }

  if (isCreate || body.description !== undefined) {
    payload.description = body.description == null ? '' : String(body.description).trim();
  }

  if (isCreate || body.instructor !== undefined) {
    payload.instructor = body.instructor == null ? '' : String(body.instructor).trim();
  }

  if (isCreate || body.thumbnailUrl !== undefined) {
    payload.thumbnailUrl = body.thumbnailUrl == null ? '' : String(body.thumbnailUrl).trim();
  }

  if (isCreate || body.bookPdfUrl !== undefined) {
    payload.bookPdfUrl = body.bookPdfUrl == null ? '' : String(body.bookPdfUrl).trim();
  }

  if (isCreate || body.vocabularyPdfUrl !== undefined) {
    payload.vocabularyPdfUrl =
      body.vocabularyPdfUrl == null ? '' : String(body.vocabularyPdfUrl).trim();
  }

  if (isCreate || body.status !== undefined) {
    payload.status = body.status || 'Draft';
  }

  if (isCreate || body.isPremium !== undefined) {
    payload.isPremium = asBoolean(body.isPremium, false);
  }

  if (isCreate || body.quizAvailable !== undefined) {
    payload.quizAvailable = asBoolean(body.quizAvailable, false);
  }

  if (isCreate || body.order !== undefined) {
    payload.order = toNumber(body.order, 0);
  }

  return payload;
};

const listCourses = async (req, res) => {
  try {
    const { status, search } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { instructor: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
      Course.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: 'Courses fetched successfully',
      courses,
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: error.message,
    });
  }
};

const getCourse = async (req, res) => {
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

    res.json({
      success: true,
      message: 'Course fetched successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course',
      error: error.message,
    });
  }
};

const createCourse = async (req, res) => {
  try {
    const validationError = validateCoursePayload(req.body, { isCreate: true });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const course = await Course.create({
      ...pickCourseFields(req.body, { isCreate: true }),
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating course',
      error: error.message,
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const validationError = validateCoursePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      pickCourseFields(req.body),
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating course',
      error: error.message,
    });
  }
};

const deleteCourse = async (req, res) => {
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

    const videos = await Video.find({ courseId }).select('_id');
    const videoIds = videos.map((video) => video._id);

    await Promise.all([
      VideoProgress.deleteMany({ $or: [{ courseId }, { videoId: { $in: videoIds } }] }),
      Video.deleteMany({ courseId }),
      Chapter.deleteMany({ courseId }),
      deletePdfsAndFiles({ courseId }),
      Course.deleteOne({ _id: courseId }),
    ]);

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course',
      error: error.message,
    });
  }
};

const reorderCourses = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    const validationError = validateOrderedIds(orderedIds);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const uniqueIds = [...new Set(orderedIds.map(String))];

    if (uniqueIds.some((id) => !isValidId(id))) {
      return invalidIdResponse(res, 'course ID');
    }

    const courses = await Course.find({ _id: { $in: uniqueIds } });

    if (courses.length !== uniqueIds.length) {
      return res.status(400).json({
        success: false,
        message: 'orderedIds must all belong to existing courses',
      });
    }

    await Promise.all(
      uniqueIds.map((id, index) => Course.findByIdAndUpdate(id, { order: index }))
    );

    const updated = await Course.find({ _id: { $in: uniqueIds } }).sort({ order: 1 });

    res.json({
      success: true,
      message: 'Courses reordered successfully',
      courses: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while reordering courses',
      error: error.message,
    });
  }
};

const listCourseOptions = async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({ order: 1, createdAt: -1 })
      .select('title status');

    res.json({
      success: true,
      message: 'Course options fetched successfully',
      courses: courses.map((course) => ({
        _id: course._id,
        title: course.title,
        status: course.status,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course options',
      error: error.message,
    });
  }
};

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
  listCourseOptions,
};
