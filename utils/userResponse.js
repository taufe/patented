const toPublicUser = (user) => {
  const userResponse = user.toObject({ virtuals: false });

  delete userResponse.password;
  delete userResponse.resetPasswordCode;
  delete userResponse.resetPasswordCodeExpires;
  delete userResponse.resetPasswordCodeSentAt;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordTokenExpires;

  userResponse.role = userResponse.role === 'admin' ? 'admin' : 'user';
  userResponse.isPremium = Boolean(userResponse.isPremium);
  userResponse.isBlocked = Boolean(userResponse.isBlocked);
  userResponse.emailVerified = Boolean(userResponse.emailVerified);
  userResponse.phone = userResponse.phone || '';
  userResponse.country = userResponse.country || '';
  userResponse.dateOfBirth = userResponse.dateOfBirth || '';
  userResponse.department = userResponse.department || '';
  userResponse.designation = userResponse.designation || '';
  userResponse.about = userResponse.about || '';
  userResponse.photoUrl = userResponse.photoUrl || '';
  userResponse.lastDevice = userResponse.lastDevice || '';
  userResponse.hobbies = userResponse.hobbies || [];
  userResponse.unlockedCourses = Array.isArray(userResponse.unlockedCourses)
    ? userResponse.unlockedCourses
    : [];
  userResponse.emailNotification = userResponse.emailNotification !== false;
  userResponse.pushNotification = userResponse.pushNotification !== false;
  userResponse.marketingEmails = Boolean(userResponse.marketingEmails);
  userResponse.biometricLogin = Boolean(userResponse.biometricLogin);
  userResponse.memberSince = userResponse.createdAt;
  userResponse.joinedDate = userResponse.createdAt;

  return userResponse;
};

module.exports = {
  toPublicUser,
};
