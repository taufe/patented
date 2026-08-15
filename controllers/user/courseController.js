const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { formatDurationLabel } = require('../../utils/duration');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const {
  isVideoLocked,
} = require('../../utils/subscription');

const PUBLISHED_COURSE = { status: 'Published' };

const toPublicCourse = (course, extra = {}) => {
  const value = course.toObject ? course.toObject() : { ...course };

  return {
    _id: value._id,
    title: value.title,
    description: value.description,
    instructor: value.instructor,
    thumbnailUrl: value.thumbnailUrl,
    bookPdfUrl: value.bookPdfUrl,
    vocabularyPdfUrl: value.vocabularyPdfUrl,
    status: value.status,
    isPremium: value.isPremium,
    quizAvailable: value.quizAvailable,
    order: value.order,
    totalChapters: value.totalChapters,
    totalVideos: value.totalVideos,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    ...extra,
  };
};

const toPublicVideo = (video, { locked = false, progress = null } = {}) => {
  const value = video.toObject ? video.toObject() : { ...video };

  return {
    _id: value._id,
    courseId: value.courseId,
    chapterId: value.chapterId,
    title: value.title,
    description: value.description,
    thumbnailUrl: value.thumbnailUrl,
    durationSeconds: value.durationSeconds,
    durationLabel: value.durationLabel || formatDurationLabel(value.durationSeconds),
    published: value.published,
    isPremium: value.isPremium,
    isFree: value.isFree,
    isLocked: locked,
    order: value.order,
    provider: value.provider,
    providerAssetId: locked ? '' : value.providerAssetId,
    videoUrl: locked ? null : value.videoUrl,
    playbackId: locked ? '' : value.playbackId,
    ...(locked ? { message: 'Premium subscription required' } : {}),
    ...(progress ? { userProgress: progress } : {}),
  };
};

const getPublishedChapterIds = async (courseId) => {
  const chapters = await Chapter.find({ courseId, published: true }).select('_id');
  return chapters.map((chapter) => chapter._id);
};

const getCourseProgress = async (userId, courseId) => {
  const chapterIds = await getPublishedChapterIds(courseId);
  const videos = await Video.find({
    courseId,
    chapterId: { $in: chapterIds },
    published: true,
  }).select('_id');

  if (videos.length === 0) {
    return 0;
  }

  const videoIds = videos.map((video) => video._id);
  const completedCount = await VideoProgress.countDocuments({
    userId,
    videoId: { $in: videoIds },
    completed: true,
  });

  return Number((completedCount / videos.length).toFixed(4));
};

const listCourses = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { ...PUBLISHED_COURSE };

    if (req.query.search && String(req.query.search).trim()) {
      const term = String(req.query.search).trim();
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

    const withProgress = await Promise.all(
      courses.map(async (course) =>
        toPublicCourse(course, {
          progress: await getCourseProgress(req.user._id, course._id),
        })
      )
    );

    res.json({
      success: true,
      message: 'Courses fetched successfully',
      courses: withProgress,
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

    const course = await Course.findOne({ _id: courseId, ...PUBLISHED_COURSE });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const chapters = await Chapter.find({ courseId, published: true }).sort({ order: 1 });
    const progress = await getCourseProgress(req.user._id, courseId);

    res.json({
      success: true,
      message: 'Course fetched successfully',
      course: toPublicCourse(course, { progress }),
      chapters: chapters.map((chapter) => ({
        _id: chapter._id,
        courseId: chapter.courseId,
        title: chapter.title,
        description: chapter.description,
        published: chapter.published,
        order: chapter.order,
        totalVideos: chapter.totalVideos,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course',
      error: error.message,
    });
  }
};

const listChapters = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const course = await Course.findOne({ _id: courseId, ...PUBLISHED_COURSE });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const chapters = await Chapter.find({ courseId, published: true }).sort({ order: 1 });

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

const getChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;

    if (!isValidId(courseId) || !isValidId(chapterId)) {
      return invalidIdResponse(res, 'ID');
    }

    const course = await Course.findOne({ _id: courseId, ...PUBLISHED_COURSE });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const chapter = await Chapter.findOne({
      _id: chapterId,
      courseId,
      published: true,
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const videos = await Video.find({ chapterId, published: true }).sort({ order: 1 });

    const progressRows = await VideoProgress.find({
      userId: req.user._id,
      videoId: { $in: videos.map((video) => video._id) },
    });
    const progressByVideo = new Map(
      progressRows.map((row) => [String(row.videoId), row])
    );

    res.json({
      success: true,
      message: 'Chapter fetched successfully',
      chapter,
      videos: videos.map((video) => {
        const locked = isVideoLocked(video, req.user, course);
        const row = progressByVideo.get(String(video._id));
        return toPublicVideo(video, {
          locked,
          progress: row
            ? {
                positionSeconds: row.positionSeconds,
                durationSeconds: row.durationSeconds,
                progress: row.progress,
                completed: row.completed,
                lastWatchedAt: row.lastWatchedAt,
              }
            : null,
        });
      }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapter',
      error: error.message,
    });
  }
};

const getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!isValidId(videoId)) {
      return invalidIdResponse(res, 'video ID');
    }

    const video = await Video.findById(videoId);

    if (!video || !video.published) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const [course, chapter, progressRow] = await Promise.all([
      Course.findById(video.courseId),
      Chapter.findById(video.chapterId),
      VideoProgress.findOne({ userId: req.user._id, videoId }),
    ]);

    if (
      !course ||
      course.status !== 'Published' ||
      !chapter ||
      !chapter.published
    ) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const locked = isVideoLocked(video, req.user, course);

    if (locked) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        video: toPublicVideo(video, { locked: true }),
      });
    }

    res.json({
      success: true,
      message: 'Video fetched successfully',
      video: toPublicVideo(video, {
        locked: false,
            progress: progressRow
          ? {
              positionSeconds: progressRow.positionSeconds,
              durationSeconds: progressRow.durationSeconds,
              progress: progressRow.progress,
              completed: progressRow.completed,
              lastWatchedAt: progressRow.lastWatchedAt,
            }
          : null,
      }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching video',
      error: error.message,
    });
  }
};

module.exports = {
  listCourses,
  getCourse,
  listChapters,
  getChapter,
  getVideo,
  toPublicVideo,
};
