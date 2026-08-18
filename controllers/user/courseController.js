const Course = require('../../models/Course');
const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const Pdf = require('../../models/Pdf');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { formatDurationLabel } = require('../../utils/duration');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const { isVideoLocked, isPdfLocked } = require('../../utils/subscription');
const { toUserProgress } = require('../../utils/learningProgress');
const { toPublicPdf } = require('../../utils/pdfResponse');

const PUBLISHED_COURSE = { status: 'Published' };

const toPublicCourse = (course, extra = {}) => {
  const value = course.toObject ? course.toObject() : { ...course };

  return {
    _id: value._id,
    title: value.title,
    description: value.description,
    instructor: value.instructor,
    thumbnailUrl: value.thumbnailUrl,
    bookPdfUrl: value.bookPdfUrl,
    vocabularyPdfUrl: value.vocabularyPdfUrl,
    status: value.status,
    isPremium: value.isPremium,
    quizAvailable: value.quizAvailable,
    order: value.order,
    totalChapters: value.totalChapters,
    totalVideos: value.totalVideos,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    ...extra,
  };
};

const toPublicVideo = (video, { locked = false, progress = null } = {}) => {
  const value = video.toObject ? video.toObject() : { ...video };

  return {
    _id: value._id,
    courseId: value.courseId,
    chapterId: value.chapterId,
    title: value.title,
    description: value.description,
    thumbnailUrl: value.thumbnailUrl,
    durationSeconds: value.durationSeconds,
    durationLabel: value.durationLabel || formatDurationLabel(value.durationSeconds),
    published: value.published,
    isPremium: value.isPremium,
    isFree: value.isFree,
    isLocked: locked,
    order: value.order,
    provider: value.provider,
    providerAssetId: locked ? '' : value.providerAssetId,
    videoUrl: locked ? null : value.videoUrl,
    playbackId: locked ? '' : value.playbackId,
    userProgress: progress || null,
    ...(locked ? { message: 'Premium subscription required' } : {}),
  };
};

const listPublishedPdfs = async (query) =>
  Pdf.find({ ...query, published: true }).sort({ order: 1, createdAt: 1 });

const toPublicPdfList = (pdfs, user, course, video = null) =>
  pdfs.map((pdf) => toPublicPdf(pdf, { locked: isPdfLocked(pdf, user, course, video) }));

const getPublishedChapterIds = async (courseId) => {
  const chapters = await Chapter.find({ courseId, published: true }).select('_id');
  return chapters.map((chapter) => chapter._id);
};

const getCourseLearningStats = async (userId, courseId) => {
  const chapterIds = await getPublishedChapterIds(courseId);
  const videos = await Video.find({
    courseId,
    chapterId: { $in: chapterIds },
    published: true,
  }).select('_id');
  const totalVideos = videos.length;
  const totalChapters = chapterIds.length;

  if (totalVideos === 0) {
    return { progress: 0, totalChapters, totalVideos, completedVideos: 0 };
  }

  const completedVideos = await VideoProgress.countDocuments({
    userId,
    videoId: { $in: videos.map((video) => video._id) },
    completed: true,
  });

  return {
    progress: Number((completedVideos / totalVideos).toFixed(4)),
    totalChapters,
    totalVideos,
    completedVideos,
  };
};

const getChapterSummaries = async (userId, chapters) => {
  if (chapters.length === 0) {
    return [];
  }

  const chapterIds = chapters.map((chapter) => chapter._id);
  const videos = await Video.find({
    chapterId: { $in: chapterIds },
    published: true,
  }).select('_id chapterId');

  const videoIdsByChapter = new Map();
  videos.forEach((video) => {
    const key = String(video.chapterId);
    const list = videoIdsByChapter.get(key) || [];
    list.push(video._id);
    videoIdsByChapter.set(key, list);
  });

  const completedRows = await VideoProgress.find({
    userId,
    videoId: { $in: videos.map((video) => video._id) },
    completed: true,
  }).select('videoId');
  const completedSet = new Set(completedRows.map((row) => String(row.videoId)));

  return chapters.map((chapter) => {
    const value = chapter.toObject ? chapter.toObject() : { ...chapter };
    const ids = videoIdsByChapter.get(String(chapter._id)) || [];
    const completedVideos = ids.filter((id) => completedSet.has(String(id))).length;
    const totalVideos = ids.length;
    const progress = totalVideos === 0 ? 0 : Number((completedVideos / totalVideos).toFixed(4));

    return {
      _id: value._id,
      courseId: value.courseId,
      title: value.title,
      description: value.description,
      published: value.published,
      order: value.order,
      totalVideos,
      completedVideos,
      progress,
      completed: totalVideos > 0 && progress === 1,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  });
};

const listCourses = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { ...PUBLISHED_COURSE };

    if (req.query.search && String(req.query.search).trim()) {
      const term = String(req.query.search).trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { instructor: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit),
      Course.countDocuments(filter),
    ]);

    const withProgress = await Promise.all(
      courses.map(async (course) => {
        const stats = await getCourseLearningStats(req.user._id, course._id);
        return toPublicCourse(course, {
          progress: stats.progress,
          totalChapters: stats.totalChapters,
          totalVideos: stats.totalVideos,
        });
      })
    );

    res.json({
      success: true,
      message: 'Courses fetched successfully',
      courses: withProgress,
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: error.message,
    });
  }
};

const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const course = await Course.findOne({ _id: courseId, ...PUBLISHED_COURSE });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const chapters = await Chapter.find({ courseId, published: true }).sort({ order: 1 });
    const [stats, chapterSummaries, coursePdfs] = await Promise.all([
      getCourseLearningStats(req.user._id, courseId),
      getChapterSummaries(req.user._id, chapters),
      listPublishedPdfs({ courseId, scope: 'course' }),
    ]);

    res.json({
      success: true,
      message: 'Course fetched successfully',
      course: toPublicCourse(course, {
        progress: stats.progress,
        totalChapters: stats.totalChapters,
        totalVideos: stats.totalVideos,
      }),
      chapters: chapterSummaries,
      pdfs: toPublicPdfList(coursePdfs, req.user, course),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course',
      error: error.message,
    });
  }
};

const listChapters = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidId(courseId)) {
      return invalidIdResponse(res, 'course ID');
    }

    const course = await Course.findOne({ _id: courseId, ...PUBLISHED_COURSE });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const chapters = await Chapter.find({ courseId, published: true }).sort({ order: 1 });
    const chapterSummaries = await getChapterSummaries(req.user._id, chapters);

    res.json({
      success: true,
      message: 'Chapters fetched successfully',
      chapters: chapterSummaries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapters',
      error: error.message,
    });
  }
};

const getChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;

    if (!isValidId(courseId) || !isValidId(chapterId)) {
      return invalidIdResponse(res, 'ID');
    }

    const course = await Course.findOne({ _id: courseId, ...PUBLISHED_COURSE });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const chapter = await Chapter.findOne({
      _id: chapterId,
      courseId,
      published: true,
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const videos = await Video.find({ chapterId, published: true }).sort({ order: 1 });
    const videoIds = videos.map((video) => video._id);

    const [progressRows, chapterPdfs, lecturePdfs] = await Promise.all([
      VideoProgress.find({
        userId: req.user._id,
        videoId: { $in: videoIds },
      }),
      listPublishedPdfs({ courseId, chapterId, scope: 'chapter' }),
      listPublishedPdfs({ videoId: { $in: videoIds }, scope: 'lecture' }),
    ]);
    const progressByVideo = new Map(
      progressRows.map((row) => [String(row.videoId), row])
    );
    const pdfsByVideo = new Map();
    lecturePdfs.forEach((pdf) => {
      const key = String(pdf.videoId);
      const list = pdfsByVideo.get(key) || [];
      list.push(pdf);
      pdfsByVideo.set(key, list);
    });
    const completedVideos = progressRows.filter((row) => row.completed).length;
    const totalVideos = videos.length;
    const chapterProgress =
      totalVideos === 0 ? 0 : Number((completedVideos / totalVideos).toFixed(4));
    const chapterValue = chapter.toObject();

    res.json({
      success: true,
      message: 'Chapter fetched successfully',
      chapter: {
        _id: chapterValue._id,
        courseId: chapterValue.courseId,
        title: chapterValue.title,
        description: chapterValue.description,
        published: chapterValue.published,
        order: chapterValue.order,
        totalVideos,
        completedVideos,
        progress: chapterProgress,
        completed: totalVideos > 0 && chapterProgress === 1,
        createdAt: chapterValue.createdAt,
        updatedAt: chapterValue.updatedAt,
      },
      pdfs: toPublicPdfList(chapterPdfs, req.user, course),
      videos: videos.map((video) => {
        const locked = isVideoLocked(video, req.user, course);
        const row = progressByVideo.get(String(video._id));
        const videoPdfs = pdfsByVideo.get(String(video._id)) || [];
        return {
          ...toPublicVideo(video, {
            locked,
            progress: toUserProgress(row),
          }),
          pdfs: toPublicPdfList(videoPdfs, req.user, course, video),
        };
      }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapter',
      error: error.message,
    });
  }
};

const getVideo = async (req, res) => {
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

    const [course, chapter, progressRow] = await Promise.all([
      Course.findById(video.courseId),
      Chapter.findById(video.chapterId),
      VideoProgress.findOne({ userId: req.user._id, videoId }),
    ]);

    if (
      !course ||
      course.status !== 'Published' ||
      !chapter ||
      !chapter.published
    ) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const locked = isVideoLocked(video, req.user, course);

    const lecturePdfs = await listPublishedPdfs({ videoId, scope: 'lecture' });

    if (locked) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        video: {
          ...toPublicVideo(video, { locked: true }),
          pdfs: toPublicPdfList(lecturePdfs, req.user, course, video),
        },
      });
    }

    res.json({
      success: true,
      message: 'Video fetched successfully',
      video: {
        ...toPublicVideo(video, {
          locked: false,
          progress: toUserProgress(progressRow),
        }),
        pdfs: toPublicPdfList(lecturePdfs, req.user, course, video),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching video',
      error: error.message,
    });
  }
};

module.exports = {
  listCourses,
  getCourse,
  listChapters,
  getChapter,
  getVideo,
  toPublicVideo,
};
