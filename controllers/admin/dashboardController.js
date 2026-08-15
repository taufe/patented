const User = require('../../models/User');
const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { toPublicUser } = require('../../utils/userResponse');
const { formatTimeAgo, startOfTodayUtc, daysAgo } = require('../../utils/relativeTime');

const countCourseCompletions = async () => {
  const publishedCourses = await Course.find({ status: 'Published' }).select('_id');

  if (publishedCourses.length === 0) {
    return 0;
  }

  const courseIds = publishedCourses.map((course) => course._id);
  const chapters = await Chapter.find({
    courseId: { $in: courseIds },
    published: true,
  }).select('_id courseId');
  const chapterIdsByCourse = new Map();

  chapters.forEach((chapter) => {
    const key = String(chapter.courseId);
    const list = chapterIdsByCourse.get(key) || [];
    list.push(chapter._id);
    chapterIdsByCourse.set(key, list);
  });

  let completedCourses = 0;

  for (const course of publishedCourses) {
    const chapterIds = chapterIdsByCourse.get(String(course._id)) || [];

    if (chapterIds.length === 0) {
      continue;
    }

    const videos = await Video.find({
      courseId: course._id,
      chapterId: { $in: chapterIds },
      published: true,
    }).select('_id');

    if (videos.length === 0) {
      continue;
    }

    const videoIds = videos.map((video) => video._id);
    const rows = await VideoProgress.aggregate([
      {
        $match: {
          courseId: course._id,
          videoId: { $in: videoIds },
          completed: true,
        },
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: videos.length,
        },
      },
    ]);

    completedCourses += rows.length;
  }

  return completedCourses;
};

const getDashboard = async (req, res) => {
  try {
    const today = startOfTodayUtc();
    const since30Days = daysAgo(30);
    const admin = toPublicUser(req.user);

    const [
      users,
      courses,
      activeFromProgress,
      activeFromLogin,
      todayUsers,
      activeCourses,
      recentUserDocs,
      recentCourseDocs,
      progressTotal,
      progressCompleted,
      completedCourses,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Course.countDocuments(),
      VideoProgress.distinct('userId', { lastWatchedAt: { $gte: since30Days } }),
      User.countDocuments({
        role: 'user',
        lastLoginAt: { $gte: since30Days },
      }),
      User.countDocuments({ role: 'user', createdAt: { $gte: today } }),
      Course.countDocuments({ status: 'Published' }),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5),
      Course.find().sort({ createdAt: -1 }).limit(5).select('title status createdAt'),
      VideoProgress.countDocuments(),
      VideoProgress.countDocuments({ completed: true }),
      countCourseCompletions(),
    ]);

    const activeStudentIds = new Set(activeFromProgress.map(String));
    const activeStudents = Math.max(activeStudentIds.size, activeFromLogin);
    const completionRate =
      progressTotal > 0 ? `${Math.round((progressCompleted / progressTotal) * 100)}%` : '0%';

    const recentUsers = recentUserDocs.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl || '',
      time: formatTimeAgo(user.createdAt),
      createdAt: user.createdAt,
    }));

    const recentCourses = recentCourseDocs.map((course) => ({
      _id: course._id,
      title: course.title,
      subtitle: `${course.status} course`,
      status: course.status,
      createdAt: course.createdAt,
    }));

    const recentActivities = [
      ...recentCourseDocs.map((course) => ({
        type: 'course_added',
        title: 'Course added',
        subtitle: `${course.title} was created`,
        createdAt: course.createdAt,
        time: formatTimeAgo(course.createdAt),
      })),
      ...recentUserDocs.map((user) => ({
        type: 'user_registered',
        title: 'User registered',
        subtitle: `${user.email} joined`,
        createdAt: user.createdAt,
        time: formatTimeAgo(user.createdAt),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    res.json({
      success: true,
      message: 'Dashboard fetched successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        photoUrl: admin.photoUrl,
      },
      overview: [
        { key: 'users', title: 'Users', value: users },
        { key: 'courses', title: 'Courses', value: courses },
        { key: 'activeStudents', title: 'Active Students', value: activeStudents },
        { key: 'certificates', title: 'Certificates', value: 0 },
      ],
      platformStats: [
        { key: 'todayUsers', title: "Today's Users", value: todayUsers },
        { key: 'activeCourses', title: 'Active Courses', value: activeCourses },
        { key: 'completedCourses', title: 'Completed Courses', value: completedCourses },
        { key: 'completionRate', title: 'Completion Rate', value: completionRate },
      ],
      recentUsers,
      recentCourses,
      recentActivities,
      notificationCount: recentActivities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
};
