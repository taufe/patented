const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toNumber } = require('../../utils/duration');
const { isVideoLocked } = require('../../utils/subscription');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const { resolveCompleted, toUserProgress, emptyProgress } = require('../../utils/learningProgress');
const { toPublicVideo } = require('./courseController');

const clampProgress = (value) => Math.min(1, Math.max(0, Number(value) || 0));

const saveProgress = async (req, res) => {
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

    const [course, chapter] = await Promise.all([
      Course.findById(video.courseId),
      Chapter.findById(video.chapterId),
    ]);

    if (!course || course.status !== 'Published' || !chapter || !chapter.published) {
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
      });
    }

    if (
      req.body.positionSeconds !== undefined &&
      (!Number.isFinite(Number(req.body.positionSeconds)) || Number(req.body.positionSeconds) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'positionSeconds must be 0 or greater',
      });
    }

    if (
      req.body.durationSeconds !== undefined &&
      (!Number.isFinite(Number(req.body.durationSeconds)) || Number(req.body.durationSeconds) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'durationSeconds must be 0 or greater',
      });
    }

    const durationSeconds = Math.max(
      0,
      toNumber(req.body.durationSeconds, video.durationSeconds || 0)
    );
    const positionSeconds = Math.max(0, toNumber(req.body.positionSeconds, 0));
    let progress =
      req.body.progress === undefined
        ? durationSeconds > 0
          ? positionSeconds / durationSeconds
          : 0
        : toNumber(req.body.progress, 0);

    progress = clampProgress(progress);
    const isCompleted = resolveCompleted({
      progress,
      completed: req.body.completed === true,
      positionSeconds,
      durationSeconds,
    });

    const record = await VideoProgress.findOneAndUpdate(
      { userId: req.user._id, videoId },
      {
        userId: req.user._id,
        courseId: video.courseId,
        chapterId: video.chapterId,
        videoId: video._id,
        positionSeconds: isCompleted ? durationSeconds : positionSeconds,
        durationSeconds,
        progress: isCompleted ? 1 : progress,
        completed: isCompleted,
        lastWatchedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Progress saved successfully',
      progress: toUserProgress(record),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while saving progress',
      error: error.message,
    });
  }
};

const mapWatchItems = async (user, rows) => {
  const videoIds = rows.map((row) => row.videoId);
  const videos = await Video.find({ _id: { $in: videoIds } });
  const videoMap = new Map(videos.map((video) => [String(video._id), video]));
  const courseIds = [...new Set(videos.map((video) => String(video.courseId)))];
  const chapterIds = [...new Set(videos.map((video) => String(video.chapterId)))];
  const [courses, chapters] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }),
    Chapter.find({ _id: { $in: chapterIds } }),
  ]);
  const courseMap = new Map(courses.map((course) => [String(course._id), course]));
  const chapterMap = new Map(chapters.map((chapter) => [String(chapter._id), chapter]));

  return rows
    .map((row) => {
      const video = videoMap.get(String(row.videoId));
      const course = video ? courseMap.get(String(video.courseId)) : null;
      const chapter = video ? chapterMap.get(String(video.chapterId)) : null;

      if (
        !video ||
        !video.published ||
        !course ||
        course.status !== 'Published' ||
        !chapter ||
        !chapter.published
      ) {
        return null;
      }

      const locked = isVideoLocked(video, user, course);

      return {
        course: {
          _id: course._id,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
        },
        chapter: {
          _id: chapter._id,
          title: chapter.title,
          order: chapter.order,
        },
        video: toPublicVideo(video, { locked }),
        progress: toUserProgress(row),
      };
    })
    .filter(Boolean);
};

const getProgress = async (req, res) => {
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

    const record = await VideoProgress.findOne({
      userId: req.user._id,
      videoId,
    });

    res.json({
      success: true,
      message: 'Progress fetched successfully',
      progress: toUserProgress(record) || emptyProgress(video),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching progress',
      error: error.message,
    });
  }
};

const continueWatching = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const rows = await VideoProgress.find({
      userId: req.user._id,
      completed: false,
      $or: [{ progress: { $gt: 0 } }, { positionSeconds: { $gt: 0 } }],
    })
      .sort({ lastWatchedAt: -1 })
      .limit(limit);

    const items = await mapWatchItems(req.user, rows);

    res.json({
      success: true,
      message: 'Continue watching fetched successfully',
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching continue watching',
      error: error.message,
    });
  }
};

const watchHistory = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {
      userId: req.user._id,
      lastWatchedAt: { $ne: null },
    };

    const [rows, total] = await Promise.all([
      VideoProgress.find(filter).sort({ lastWatchedAt: -1 }).skip(skip).limit(limit),
      VideoProgress.countDocuments(filter),
    ]);

    const items = await mapWatchItems(req.user, rows);

    res.json({
      success: true,
      message: 'Watch history fetched successfully',
      items,
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching watch history',
      error: error.message,
    });
  }
};

module.exports = {
  saveProgress,
  getProgress,
  continueWatching,
  watchHistory,
};
