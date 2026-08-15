const Chapter = require('../../models/Chapter');
const Video = require('../../models/Video');
const VideoProgress = require('../../models/VideoProgress');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { formatDurationLabel, toNumber } = require('../../utils/duration');
const { recountChapter, recountCourse } = require('../../services/contentCounters');
const {
  detectProvider,
  extractProviderAssetId,
} = require('../../services/videoStorage.service');
const {
  asBoolean,
  validateVideoPayload,
  validateOrderedIds,
} = require('../../utils/courseValidation');

const nextVideoOrder = async (chapterId) => {
  const last = await Video.findOne({ chapterId }).sort({ order: -1 }).select('order');
  return last ? last.order + 1 : 0;
};

const toVideoPayload = (body, { isCreate, chapter, existing } = {}) => {
  const videoUrl = (isCreate ? body.videoUrl : body.videoUrl ?? existing.videoUrl) || '';
  const provider = detectProvider(videoUrl, body.provider);
  const durationSeconds =
    body.durationSeconds === undefined
      ? isCreate
        ? 0
        : existing.durationSeconds
      : toNumber(body.durationSeconds, 0);
  const durationLabel =
    body.durationLabel !== undefined && String(body.durationLabel).trim()
      ? String(body.durationLabel).trim()
      : formatDurationLabel(durationSeconds);

  const payload = isCreate
    ? {
        courseId: chapter.courseId,
        chapterId: chapter._id,
        title: String(body.title).trim(),
        description: body.description == null ? '' : String(body.description).trim(),
        thumbnailUrl: body.thumbnailUrl == null ? '' : String(body.thumbnailUrl).trim(),
        durationSeconds,
        durationLabel,
        published: asBoolean(body.published, false),
        isPremium: asBoolean(body.isPremium, false),
        isFree: asBoolean(body.isFree, true),
        order: body.order === undefined ? undefined : toNumber(body.order, 0),
        provider,
        providerAssetId:
          body.providerAssetId == null || body.providerAssetId === ''
            ? extractProviderAssetId(videoUrl, provider)
            : String(body.providerAssetId).trim(),
        videoUrl: String(videoUrl).trim(),
        playbackId: body.playbackId == null ? '' : String(body.playbackId).trim(),
      }
    : {};

  if (!isCreate) {
    if (body.title !== undefined) {
      payload.title = String(body.title).trim();
    }

    if (body.description !== undefined) {
      payload.description = body.description == null ? '' : String(body.description).trim();
    }

    if (body.thumbnailUrl !== undefined) {
      payload.thumbnailUrl = body.thumbnailUrl == null ? '' : String(body.thumbnailUrl).trim();
    }

    if (body.durationSeconds !== undefined || body.durationLabel !== undefined) {
      payload.durationSeconds = durationSeconds;
      payload.durationLabel = durationLabel;
    }

    if (body.published !== undefined) {
      payload.published = asBoolean(body.published, false);
    }

    if (body.isPremium !== undefined) {
      payload.isPremium = asBoolean(body.isPremium, false);
    }

    if (body.isFree !== undefined) {
      payload.isFree = asBoolean(body.isFree, true);
    }

    if (body.order !== undefined) {
      payload.order = toNumber(body.order, 0);
    }

    if (body.videoUrl !== undefined) {
      payload.videoUrl = String(videoUrl).trim();
      payload.provider = provider;
      payload.providerAssetId =
        body.providerAssetId == null || body.providerAssetId === ''
          ? extractProviderAssetId(videoUrl, provider)
          : String(body.providerAssetId).trim();
    }

    if (body.provider !== undefined && body.videoUrl === undefined) {
      payload.provider = provider;
    }

    if (body.providerAssetId !== undefined) {
      payload.providerAssetId = String(body.providerAssetId).trim();
    }

    if (body.playbackId !== undefined) {
      payload.playbackId = String(body.playbackId).trim();
    }
  }

  return payload;
};

const listVideos = async (req, res) => {
  try {
    const { chapterId } = req.params;

    if (!isValidId(chapterId)) {
      return invalidIdResponse(res, 'chapter ID');
    }

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const videos = await Video.find({ chapterId }).sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      message: 'Videos fetched successfully',
      videos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching videos',
      error: error.message,
    });
  }
};

const createVideo = async (req, res) => {
  try {
    const { chapterId } = req.params;

    if (!isValidId(chapterId)) {
      return invalidIdResponse(res, 'chapter ID');
    }

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const validationError = validateVideoPayload(req.body, { isCreate: true });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const payload = toVideoPayload(req.body, { isCreate: true, chapter });
    payload.order =
      payload.order === undefined ? await nextVideoOrder(chapterId) : payload.order;

    const video = await Video.create(payload);

    await Promise.all([recountChapter(chapterId), recountCourse(chapter.courseId)]);

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating video',
      error: error.message,
    });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!isValidId(videoId)) {
      return invalidIdResponse(res, 'video ID');
    }

    const existing = await Video.findById(videoId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const validationError = validateVideoPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      toVideoPayload(req.body, { existing }),
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Video updated successfully',
      video,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating video',
      error: error.message,
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!isValidId(videoId)) {
      return invalidIdResponse(res, 'video ID');
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    await Promise.all([
      VideoProgress.deleteMany({ videoId }),
      Video.deleteOne({ _id: videoId }),
    ]);

    await Promise.all([recountChapter(video.chapterId), recountCourse(video.courseId)]);

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting video',
      error: error.message,
    });
  }
};

const reorderVideos = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { orderedIds } = req.body;

    if (!isValidId(chapterId)) {
      return invalidIdResponse(res, 'chapter ID');
    }

    const validationError = validateOrderedIds(orderedIds);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const uniqueIds = [...new Set(orderedIds.map(String))];

    if (uniqueIds.some((id) => !isValidId(id))) {
      return invalidIdResponse(res, 'video ID');
    }

    const videos = await Video.find({ _id: { $in: uniqueIds }, chapterId });

    if (videos.length !== uniqueIds.length) {
      return res.status(400).json({
        success: false,
        message: 'orderedIds must all belong to this chapter',
      });
    }

    await Promise.all(
      uniqueIds.map((id, index) => Video.findByIdAndUpdate(id, { order: index }))
    );

    const updated = await Video.find({ chapterId }).sort({ order: 1 });

    res.json({
      success: true,
      message: 'Videos reordered successfully',
      videos: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while reordering videos',
      error: error.message,
    });
  }
};

module.exports = {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
};
