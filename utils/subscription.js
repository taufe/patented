const userHasActiveSubscription = async (user) => {
  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  return Boolean(user.isPremium);
};

const isVideoLocked = (video, hasSubscription) => {
  if (video.isFree) {
    return false;
  }

  if (!video.isPremium) {
    return false;
  }

  return !hasSubscription;
};

module.exports = {
  userHasActiveSubscription,
  isVideoLocked,
};
