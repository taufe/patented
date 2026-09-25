const Chapter = require('../models/Chapter');
const Video = require('../models/Video');

const CHAPTER_4_TITLE = /chapter\s*4\b/i;
const NUMBERED_CHAPTER_TITLE = /chapter\s*(\d+)\b/i;

const isChapter4 = (chapter) => {
  if (!chapter) {
    return false;
  }

  const title = String(chapter.title || '');
  const numbered = title.match(NUMBERED_CHAPTER_TITLE);

  if (numbered) {
    return Number(numbered[1]) === 4;
  }

  return Number(chapter.order) === 4;
};

const applyChapter4Preview = async (chapter) => {
  if (!isChapter4(chapter)) {
    return { updated: 0, total: 0 };
  }

  const videos = await Video.find({ chapterId: chapter._id }).sort({
    order: 1,
    createdAt: 1,
  });
  let updated = 0;

  await Promise.all(
    videos.map(async (video, index) => {
      const isFree = index === 0;
      const isPremium = !isFree;

      if (video.isFree === isFree && video.isPremium === isPremium) {
        return;
      }

      video.isFree = isFree;
      video.isPremium = isPremium;
      await video.save();
      updated += 1;
    })
  );

  return { updated, total: videos.length };
};

const findFirstChapter4VideoId = async () => {
  const chapters = await Chapter.find({
    $or: [{ title: { $regex: CHAPTER_4_TITLE } }, { order: 4 }],
  })
    .sort({ order: 1, createdAt: 1 })
    .select('title order');

  for (const chapter of chapters) {
    if (!isChapter4(chapter)) {
      continue;
    }

    const video = await Video.findOne({ chapterId: chapter._id })
      .sort({ order: 1, createdAt: 1 })
      .select('_id');

    if (video) {
      return video._id;
    }
  }

  return null;
};

const applyAllChapter4Previews = async () => {
  const chapters = await Chapter.find({
    $or: [{ title: { $regex: CHAPTER_4_TITLE } }, { order: 4 }],
  });
  const results = [];

  for (const chapter of chapters) {
    if (!isChapter4(chapter)) {
      continue;
    }

    const applied = await applyChapter4Preview(chapter);
    results.push({
      chapterId: chapter._id,
      title: chapter.title,
      order: chapter.order,
      ...applied,
    });
  }

  return results;
};

module.exports = {
  CHAPTER_4_TITLE,
  isChapter4,
  findFirstChapter4VideoId,
  applyChapter4Preview,
  applyAllChapter4Previews,
};
