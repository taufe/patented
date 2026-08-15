const { getVideoCompletionThreshold } = require('../config/env');

const resolveCompleted = ({ progress, completed, positionSeconds, durationSeconds }) => {
  const threshold = getVideoCompletionThreshold();
  const pct = Number(progress) || 0;
  const pos = Number(positionSeconds) || 0;
  const dur = Number(durationSeconds) || 0;
  const byClient = completed === true;
  const byProgress = pct >= threshold;
  const byPosition = dur > 0 && pos / dur >= threshold;

  return byClient || byProgress || byPosition;
};

const toUserProgress = (row) => {
  if (!row) {
    return null;
  }

  const value = row.toObject ? row.toObject() : { ...row };

  return {
    _id: value._id,
    userId: value.userId,
    courseId: value.courseId,
    chapterId: value.chapterId,
    videoId: value.videoId,
    positionSeconds: value.positionSeconds,
    durationSeconds: value.durationSeconds,
    progress: value.progress,
    completed: value.completed,
    lastWatchedAt: value.lastWatchedAt,
  };
};

const emptyProgress = (video = {}) => ({
  positionSeconds: 0,
  durationSeconds: video.durationSeconds || 0,
  progress: 0,
  completed: false,
  lastWatchedAt: null,
});

module.exports = {
  resolveCompleted,
  toUserProgress,
  emptyProgress,
};
