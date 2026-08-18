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

const hasUnlockedCourse = (user, courseId) => {
  if (!user || !courseId || !Array.isArray(user.unlockedCourses)) {
    return false;
  }

  return user.unlockedCourses.some((item) => {
    const id = item && item._id ? item._id : item;
    return String(id) === String(courseId);
  });
};

const isVideoLocked = (video, user, course) => {
  if (video.isFree) {
    return false;
  }

  if (!user) {
    return Boolean(video.isPremium || (course && course.isPremium));
  }

  if (user.role === 'admin' || hasActivePremium(user)) {
    return false;
  }

  if (hasUnlockedCourse(user, video.courseId)) {
    return false;
  }

  if (video.isPremium) {
    return true;
  }

  if (course && course.isPremium) {
    return true;
  }

  return false;
};

const isCourseContentLocked = (user, course) => {
  if (!course || !course.isPremium) {
    return false;
  }

  if (!user) {
    return true;
  }

  if (user.role === 'admin' || hasActivePremium(user)) {
    return false;
  }

  if (hasUnlockedCourse(user, course._id)) {
    return false;
  }

  return true;
};

const isPdfLocked = (pdf, user, course, video = null) => {
  if (pdf && pdf.scope === 'lecture' && video) {
    return isVideoLocked(video, user, course);
  }

  return isCourseContentLocked(user, course);
};

module.exports = {
  hasActivePremium,
  userHasActiveSubscription,
  hasUnlockedCourse,
  isVideoLocked,
  isCourseContentLocked,
  isPdfLocked,
};
