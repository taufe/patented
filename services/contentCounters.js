const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Video = require('../models/Video');

const recountChapter = async (chapterId) => {
  const totalVideos = await Video.countDocuments({ chapterId });
  await Chapter.findByIdAndUpdate(chapterId, { totalVideos });
  return totalVideos;
};

const recountCourse = async (courseId) => {
  const [totalChapters, totalVideos] = await Promise.all([
    Chapter.countDocuments({ courseId }),
    Video.countDocuments({ courseId }),
  ]);

  await Course.findByIdAndUpdate(courseId, { totalChapters, totalVideos });
  return { totalChapters, totalVideos };
};

module.exports = {
  recountChapter,
  recountCourse,
};
