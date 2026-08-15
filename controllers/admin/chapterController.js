const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toNumber } = require('../../utils/duration');
const { recountCourse } = require('../../services/contentCounters');
const {
  asBoolean,
  validateChapterPayload,
  validateOrderedIds,
} = require('../../utils/courseValidation');

const nextChapterOrder = async (courseId) => {
  const last = await Chapter.findOne({ courseId }).sort({ order: -1 }).select('order');
  return last ? last.order + 1 : 0;
};

const listChapters = async (req, res) => {
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

    const chapters = await Chapter.find({ courseId }).sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      message: 'Chapters fetched successfully',
      chapters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapters',
      error: error.message,
    });
  }
};

const createChapter = async (req, res) => {
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

    const validationError = validateChapterPayload(req.body, { isCreate: true });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const order =
      req.body.order === undefined ? await nextChapterOrder(courseId) : toNumber(req.body.order, 0);

    const chapter = await Chapter.create({
      courseId,
      title: String(req.body.title).trim(),
      description: req.body.description == null ? '' : String(req.body.description).trim(),
      published: asBoolean(req.body.published, false),
      order,
    });

    await recountCourse(courseId);

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      chapter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating chapter',
      error: error.message,
    });
  }
};

const updateChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;

    if (!isValidId(chapterId)) {
      return invalidIdResponse(res, 'chapter ID');
    }

    const validationError = validateChapterPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      updates.title = String(req.body.title).trim();
    }

    if (req.body.description !== undefined) {
      updates.description = req.body.description == null ? '' : String(req.body.description).trim();
    }

    if (req.body.published !== undefined) {
      updates.published = asBoolean(req.body.published, false);
    }

    if (req.body.order !== undefined) {
      updates.order = toNumber(req.body.order, 0);
    }

    const chapter = await Chapter.findByIdAndUpdate(chapterId, updates, {
      new: true,
      runValidators: true,
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    res.json({
      success: true,
      message: 'Chapter updated successfully',
      chapter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating chapter',
      error: error.message,
    });
  }
};

const deleteChapter = async (req, res) => {
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

    await Promise.all([
      VideoProgress.deleteMany({ chapterId }),
      Video.deleteMany({ chapterId }),
      Chapter.deleteOne({ _id: chapterId }),
    ]);

    await recountCourse(chapter.courseId);

    res.json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting chapter',
      error: error.message,
    });
  }
};

const reorderChapters = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { orderedIds } = req.body;

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const validationError = validateOrderedIds(orderedIds);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const uniqueIds = [...new Set(orderedIds.map(String))];

    if (uniqueIds.some((id) => !isValidId(id))) {
      return invalidIdResponse(res, 'chapter ID');
    }

    const chapters = await Chapter.find({ _id: { $in: uniqueIds }, courseId });

    if (chapters.length !== uniqueIds.length) {
      return res.status(400).json({
        success: false,
        message: 'orderedIds must all belong to this course',
      });
    }

    await Promise.all(
      uniqueIds.map((id, index) => Chapter.findByIdAndUpdate(id, { order: index }))
    );

    const updated = await Chapter.find({ courseId }).sort({ order: 1 });

    res.json({
      success: true,
      message: 'Chapters reordered successfully',
      chapters: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while reordering chapters',
      error: error.message,
    });
  }
};

module.exports = {
  listChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
};
