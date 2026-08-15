const userHasActiveSubscription = async (user) => {
  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  return Boolean(user.isPremium);
};

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

  if (user.role === 'admin' || user.isPremium) {
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

module.exports = {
  userHasActiveSubscription,
  hasUnlockedCourse,
  isVideoLocked,
};
