#!/usr/bin/env node

require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Video = require('../models/Video');
const VideoProgress = require('../models/VideoProgress');
const connectDB = require('../config/db');
const { recountChapter, recountCourse } = require('../services/contentCounters');

const COURSE_TITLE = 'Driving License Type B';

const seed = async () => {
  await connectDB();

  const admin = await User.findOne({ role: 'admin' });

  let course = await Course.findOne({ title: COURSE_TITLE });

  if (course) {
    await VideoProgress.deleteMany({ courseId: course._id });
    await Video.deleteMany({ courseId: course._id });
    await Chapter.deleteMany({ courseId: course._id });
    course.title = COURSE_TITLE;
    course.description = 'Complete Type B driving license video course.';
    course.instructor = 'Admin';
    course.thumbnailUrl = 'https://placehold.co/800x450/png?text=Driving+License+Type+B';
    course.status = 'Published';
    course.isPremium = false;
    course.quizAvailable = true;
    course.order = 1;
    course.createdBy = admin ? admin._id : course.createdBy;
    await course.save();
    console.log('Updated course:', COURSE_TITLE);
  } else {
    course = await Course.create({
      title: COURSE_TITLE,
      description: 'Complete Type B driving license video course.',
      instructor: 'Admin',
      thumbnailUrl: 'https://placehold.co/800x450/png?text=Driving+License+Type+B',
      status: 'Published',
      isPremium: false,
      quizAvailable: true,
      order: 1,
      createdBy: admin ? admin._id : undefined,
    });
    console.log('Created course:', COURSE_TITLE);
  }

  const chapter1 = await Chapter.create({
    courseId: course._id,
    title: 'Chapter 1 - Introduction',
    description: 'Get started with the Type B driving license course.',
    published: true,
    order: 0,
  });

  const chapter2 = await Chapter.create({
    courseId: course._id,
    title: 'Chapter 2 - Rules of the Road',
    description: 'Core traffic rules and practical examples.',
    published: true,
    order: 1,
  });

  await Video.create([
    {
      courseId: course._id,
      chapterId: chapter1._id,
      title: 'Lecture 1 - Welcome',
      description: 'Intro lecture',
      thumbnailUrl: 'https://placehold.co/800x450/png?text=Lecture+1',
      videoUrl: 'https://vimeo.com/76979871',
      durationSeconds: 510,
      durationLabel: '08:30',
      published: true,
      isPremium: false,
      isFree: true,
      order: 0,
      provider: 'vimeo',
      providerAssetId: '76979871',
    },
    {
      courseId: course._id,
      chapterId: chapter1._id,
      title: 'Lecture 2 - Course Overview',
      description: 'What you will learn in this series.',
      thumbnailUrl: 'https://placehold.co/800x450/png?text=Lecture+2',
      videoUrl: 'https://vimeo.com/76979871',
      durationSeconds: 600,
      durationLabel: '10:00',
      published: true,
      isPremium: true,
      isFree: false,
      order: 1,
      provider: 'vimeo',
      providerAssetId: '76979871',
    },
    {
      courseId: course._id,
      chapterId: chapter2._id,
      title: 'Lecture 3 - Traffic Signs',
      description: 'Essential traffic signs.',
      thumbnailUrl: 'https://placehold.co/800x450/png?text=Lecture+3',
      videoUrl: 'https://vimeo.com/76979871',
      durationSeconds: 420,
      durationLabel: '07:00',
      published: true,
      isPremium: false,
      isFree: true,
      order: 0,
      provider: 'vimeo',
      providerAssetId: '76979871',
    },
  ]);

  await Promise.all([
    recountChapter(chapter1._id),
    recountChapter(chapter2._id),
    recountCourse(course._id),
  ]);

  console.log('Seeded 2 chapters and 3 videos');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
