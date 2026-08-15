#!/usr/bin/env node

require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Video = require('../models/Video');
const VideoProgress = require('../models/VideoProgress');
const connectDB = require('../config/db');
const { recountChapter, recountCourse } = require('../services/contentCounters');
const { formatDurationLabel } = require('../utils/duration');

const SAMPLE_VIMEO_URL = 'https://vimeo.com/76979871';
const SAMPLE_ASSET_ID = '76979871';

const COURSE_SPECS = [
  {
    title: 'Driving License Type B',
    description: 'Complete Type B driving license video course.',
    thumbnailUrl: 'https://placehold.co/800x450/png?text=Driving+License+Type+B',
    order: 1,
  },
  {
    title: 'Road Safety & Traffic Rules',
    description: 'Road safety, signs, and traffic rules for learners.',
    thumbnailUrl: 'https://placehold.co/800x450/png?text=Road+Safety',
    order: 2,
  },
];

const CHAPTER_TITLES = [
  'Introduction',
  'Basic Controls',
  'Traffic Signs',
  'Rules of the Road',
  'City Driving',
  'Highway Driving',
  'Parking',
  'Final Review',
];

const LECTURE_TITLES = [
  'Overview',
  'Key Concepts',
  'Practical Demo',
  'Common Mistakes',
  'Safety Tips',
  'Practice Drill',
  'Quiz Recap',
  'Summary',
];

const seedCourse = async ({ spec, admin, courseIndex }) => {
  let course = await Course.findOne({ title: spec.title });

  if (course) {
    await VideoProgress.deleteMany({ courseId: course._id });
    await Video.deleteMany({ courseId: course._id });
    await Chapter.deleteMany({ courseId: course._id });
    course.set({
      title: spec.title,
      description: spec.description,
      instructor: 'Admin',
      thumbnailUrl: spec.thumbnailUrl,
      status: 'Published',
      isPremium: false,
      quizAvailable: true,
      order: spec.order,
      createdBy: admin ? admin._id : course.createdBy,
    });
    await course.save();
    console.log('Updated course:', spec.title);
  } else {
    course = await Course.create({
      title: spec.title,
      description: spec.description,
      instructor: 'Admin',
      thumbnailUrl: spec.thumbnailUrl,
      status: 'Published',
      isPremium: false,
      quizAvailable: true,
      order: spec.order,
      createdBy: admin ? admin._id : undefined,
    });
    console.log('Created course:', spec.title);
  }

  for (let chapterIndex = 0; chapterIndex < CHAPTER_TITLES.length; chapterIndex += 1) {
    const chapter = await Chapter.create({
      courseId: course._id,
      title: `Chapter ${chapterIndex + 1} - ${CHAPTER_TITLES[chapterIndex]}`,
      description: `${CHAPTER_TITLES[chapterIndex]} for ${spec.title}.`,
      published: true,
      order: chapterIndex,
    });

    const videos = LECTURE_TITLES.map((lectureTitle, lectureIndex) => {
      const isFree = lectureIndex < 2;
      const durationSeconds = 420 + (courseIndex + chapterIndex + lectureIndex) * 15;

      return {
        courseId: course._id,
        chapterId: chapter._id,
        title: `Lecture ${lectureIndex + 1} - ${lectureTitle}`,
        description: `${lectureTitle} in ${chapter.title}.`,
        thumbnailUrl: `https://placehold.co/800x450/png?text=L${lectureIndex + 1}`,
        videoUrl: SAMPLE_VIMEO_URL,
        durationSeconds,
        durationLabel: formatDurationLabel(durationSeconds),
        published: true,
        isPremium: !isFree,
        isFree,
        order: lectureIndex,
        provider: 'vimeo',
        providerAssetId: SAMPLE_ASSET_ID,
      };
    });

    await Video.insertMany(videos);
    await recountChapter(chapter._id);
  }

  await recountCourse(course._id);
};

const seed = async () => {
  await connectDB();
  const admin = await User.findOne({ role: 'admin' });

  for (let index = 0; index < COURSE_SPECS.length; index += 1) {
    await seedCourse({
      spec: COURSE_SPECS[index],
      admin,
      courseIndex: index,
    });
  }

  console.log('Seeded 2 courses, 8 chapters each, 8 lectures each');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
