const VIDEO_LOCK_MESSAGE =
  'This lecture is locked. Contact the administrator after a manual payment.';

const hasActivePremium = (user) => {
  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  if (!user.isPremium) {
    return false;
  }

  if (user.premiumExpiresAt && new Date(user.premiumExpiresAt).getTime() <= Date.now()) {
    return false;
  }

  return true;
};

const userHasActiveSubscription = async (user) => hasActivePremium(user);

const toRefId = (item) => {
  if (!item) {
    return '';
  }

  return String(item._id ? item._id : item);
};

const hasUnlockedCourse = (user, courseId) => {
  if (!user || !courseId || !Array.isArray(user.unlockedCourses)) {
    return false;
  }

  return user.unlockedCourses.some((item) => toRefId(item) === String(courseId));
};

const hasUnlockedVideo = (user, videoId) => {
  if (!user || !videoId || !Array.isArray(user.unlockedVideos)) {
    return false;
  }

  return user.unlockedVideos.some((item) => toRefId(item) === String(videoId));
};

const isVideoLocked = (video, user) => {
  if (!video) {
    return true;
  }

  if (video.isFree === true) {
    return false;
  }

  if (!user) {
    return true;
  }

  if (user.role === 'admin') {
    return false;
  }

  if (hasUnlockedVideo(user, video._id)) {
    return false;
  }

  if (hasUnlockedCourse(user, video.courseId)) {
    return false;
  }

  return true;
};

const isCourseContentLocked = (user, course) => {
  if (!course || !course.isPremium) {
    return false;
  }

  if (!user) {
    return true;
  }

  if (user.role === 'admin') {
    return false;
  }

  if (hasUnlockedCourse(user, course._id)) {
    return false;
  }

  return true;
};

const isPdfLocked = (pdf, user, course, video = null) => {
  if (pdf && pdf.scope === 'lecture' && video) {
    return isVideoLocked(video, user);
  }

  return isCourseContentLocked(user, course);
};

module.exports = {
  VIDEO_LOCK_MESSAGE,
  hasActivePremium,
  userHasActiveSubscription,
  hasUnlockedCourse,
  hasUnlockedVideo,
  isVideoLocked,
  isCourseContentLocked,
  isPdfLocked,
};
