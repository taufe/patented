#!/usr/bin/env node

require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Video = require('../models/Video');
const VideoProgress = require('../models/VideoProgress');
const connectDB = require('../config/db');
const { recountChapter, recountCourse } = require('../services/contentCounters');
const { formatDurationLabel, parseDurationLabel } = require('../utils/duration');
const seedData = require('../data/SEED_DRIVING_LICENSE_TYPE_B.json');

const STUB_COURSE_TITLES = ['Road Safety & Traffic Rules'];

const deleteCourseTree = async (courseId) => {
  await Promise.all([
    VideoProgress.deleteMany({ courseId }),
    Video.deleteMany({ courseId }),
    Chapter.deleteMany({ courseId }),
  ]);
  await Course.deleteOne({ _id: courseId });
};

const seedTypeB = async (admin) => {
  const { course: courseSpec, chapters } = seedData;

  if (!courseSpec || !Array.isArray(chapters)) {
    throw new Error('SEED_DRIVING_LICENSE_TYPE_B.json is missing course/chapters');
  }

  let course = await Course.findOne({ title: courseSpec.title });

  if (course) {
    await VideoProgress.deleteMany({ courseId: course._id });
    await Video.deleteMany({ courseId: course._id });
    await Chapter.deleteMany({ courseId: course._id });
    course.set({
      title: courseSpec.title,
      description: courseSpec.description || '',
      instructor: courseSpec.instructor || 'Patenta',
      thumbnailUrl: courseSpec.thumbnailUrl || '',
      status: 'Published',
      isPremium: Boolean(courseSpec.isPremium),
      quizAvailable: courseSpec.quizAvailable !== false,
      order: Number.isFinite(Number(courseSpec.order)) ? Number(courseSpec.order) : 0,
      createdBy: admin ? admin._id : course.createdBy,
    });
    await course.save();
    console.log('Updated course:', course.title);
  } else {
    course = await Course.create({
      title: courseSpec.title,
      description: courseSpec.description || '',
      instructor: courseSpec.instructor || 'Patenta',
      thumbnailUrl: courseSpec.thumbnailUrl || '',
      status: 'Published',
      isPremium: Boolean(courseSpec.isPremium),
      quizAvailable: courseSpec.quizAvailable !== false,
      order: Number.isFinite(Number(courseSpec.order)) ? Number(courseSpec.order) : 0,
      createdBy: admin ? admin._id : undefined,
    });
    console.log('Created course:', course.title);
  }

  let videoCount = 0;

  for (const chapterSpec of chapters) {
    const chapter = await Chapter.create({
      courseId: course._id,
      title: chapterSpec.title,
      description: chapterSpec.description || '',
      published: chapterSpec.published !== false,
      order: Number.isFinite(Number(chapterSpec.order)) ? Number(chapterSpec.order) : 0,
    });

    const videos = (chapterSpec.videos || []).map((videoSpec, lectureIndex) => {
      const isFree = lectureIndex < 2;
      const durationSeconds = parseDurationLabel(
        videoSpec.durationLabel,
        videoSpec.durationSeconds
      );

      return {
        courseId: course._id,
        chapterId: chapter._id,
        title: videoSpec.title,
        description: videoSpec.description || '',
        thumbnailUrl: videoSpec.thumbnailUrl || '',
        videoUrl: videoSpec.videoUrl,
        durationSeconds,
        durationLabel:
          durationSeconds > 0
            ? formatDurationLabel(durationSeconds)
            : videoSpec.durationLabel || '',
        published: true,
        isPremium: !isFree,
        isFree,
        order: lectureIndex,
        provider: videoSpec.provider || 'vimeo',
        providerAssetId: String(videoSpec.providerAssetId || ''),
      };
    });

    if (videos.length > 0) {
      await Video.insertMany(videos);
      videoCount += videos.length;
    }

    await recountChapter(chapter._id);
  }

  await recountCourse(course._id);
  console.log(`Seeded ${chapters.length} chapters and ${videoCount} videos`);
};

const seed = async () => {
  await connectDB();
  const admin = await User.findOne({ role: 'admin' });

  for (const title of STUB_COURSE_TITLES) {
    const stub = await Course.findOne({ title });
    if (stub) {
      await deleteCourseTree(stub._id);
      console.log('Removed stub course:', title);
    }
  }

  await seedTypeB(admin);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
