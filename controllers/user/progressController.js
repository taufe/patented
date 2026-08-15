const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { toNumber } = require('../../utils/duration');
const { isVideoLocked } = require('../../utils/subscription');
const { toPublicVideo } = require('./courseController');

const clampProgress = (value) => Math.min(1, Math.max(0, Number(value) || 0));

const applyCompletionRule = ({ progress, completed }) => {
  if (completed || progress >= 0.95) {
    return { progress: 1, completed: true };
  }

  return { progress, completed: false };
};

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
    const completedFlag = Boolean(req.body.completed);
    const completion = applyCompletionRule({ progress, completed: completedFlag });

    const record = await VideoProgress.findOneAndUpdate(
      { userId: req.user._id, videoId },
      {
        userId: req.user._id,
        courseId: video.courseId,
        chapterId: video.chapterId,
        videoId: video._id,
        positionSeconds: completion.completed ? durationSeconds : positionSeconds,
        durationSeconds,
        progress: completion.progress,
        completed: completion.completed,
        lastWatchedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Progress saved successfully',
      progress: record,
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
        },
        video: toPublicVideo(video, { locked }),
        progress: {
          positionSeconds: row.positionSeconds,
          durationSeconds: row.durationSeconds,
          progress: row.progress,
          completed: row.completed,
          lastWatchedAt: row.lastWatchedAt,
        },
      };
    })
    .filter(Boolean);
};

const continueWatching = async (req, res) => {
  try {
    const rows = await VideoProgress.find({
      userId: req.user._id,
      completed: false,
      progress: { $gt: 0 },
    })
      .sort({ lastWatchedAt: -1 })
      .limit(20);

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
    const rows = await VideoProgress.find({ userId: req.user._id })
      .sort({ lastWatchedAt: -1 })
      .limit(50);

    const items = await mapWatchItems(req.user, rows);

    res.json({
      success: true,
      message: 'Watch history fetched successfully',
      items,
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
  continueWatching,
  watchHistory,
};
