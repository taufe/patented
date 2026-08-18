const COURSE_STATUSES = ['Draft', 'Published', 'Archived'];
const PDF_KINDS = ['book', 'vocabulary', 'notes', 'handout'];
const { PROVIDERS } = require('../services/videoStorage.service');
const { toNumber } = require('./duration');

const asBoolean = (value, fallback) => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return fallback;
};

const validateTitle = (title, label = 'Title') => {
  if (!title || !String(title).trim()) {
    return `${label} is required`;
  }

  return null;
};

const validateCoursePayload = (body, { isCreate } = {}) => {
  if (isCreate) {
    const titleError = validateTitle(body.title, 'Course title');
    if (titleError) {
      return titleError;
    }
  } else if (body.title !== undefined) {
    const titleError = validateTitle(body.title, 'Course title');
    if (titleError) {
      return titleError;
    }
  }

  if (body.status !== undefined && !COURSE_STATUSES.includes(body.status)) {
    return 'Status must be Draft, Published, or Archived';
  }

  if (body.order !== undefined && toNumber(body.order, -1) < 0) {
    return 'Order must be 0 or greater';
  }

  return null;
};

const validateChapterPayload = (body, { isCreate } = {}) => {
  if (isCreate) {
    const titleError = validateTitle(body.title, 'Chapter title');
    if (titleError) {
      return titleError;
    }
  } else if (body.title !== undefined) {
    const titleError = validateTitle(body.title, 'Chapter title');
    if (titleError) {
      return titleError;
    }
  }

  if (body.order !== undefined && toNumber(body.order, -1) < 0) {
    return 'Order must be 0 or greater';
  }

  return null;
};

const validateVideoPayload = (body, { isCreate } = {}) => {
  if (isCreate) {
    const titleError = validateTitle(body.title, 'Video title');
    if (titleError) {
      return titleError;
    }

    if (!body.videoUrl || !String(body.videoUrl).trim()) {
      return 'Video URL is required';
    }
  } else {
    if (body.title !== undefined) {
      const titleError = validateTitle(body.title, 'Video title');
      if (titleError) {
        return titleError;
      }
    }

    if (body.videoUrl !== undefined && !String(body.videoUrl).trim()) {
      return 'Video URL is required';
    }
  }

  if (body.provider !== undefined && !PROVIDERS.includes(body.provider)) {
    return 'Provider must be external, vimeo, cloudinary, s3, or mux';
  }

  if (body.order !== undefined && toNumber(body.order, -1) < 0) {
    return 'Order must be 0 or greater';
  }

  if (body.durationSeconds !== undefined && toNumber(body.durationSeconds, -1) < 0) {
    return 'Duration must be 0 or greater';
  }

  return null;
};

const validateOrderedIds = (orderedIds) => {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return 'orderedIds must be a non-empty array';
  }

  return null;
};

const validatePdfPayload = (body = {}) => {
  if (body.title !== undefined) {
    const titleError = validateTitle(body.title, 'PDF title');
    if (titleError) {
      return titleError;
    }
  }

  if (body.kind !== undefined && body.kind !== '' && !PDF_KINDS.includes(String(body.kind).trim())) {
    return 'Kind must be book, vocabulary, notes, or handout';
  }

  if (body.order !== undefined && toNumber(body.order, -1) < 0) {
    return 'Order must be 0 or greater';
  }

  return null;
};

const titleFromFileName = (originalFileName = '') => {
  const base = String(originalFileName)
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/\.pdf$/i, '')
    .trim();

  return base || 'Learning material';
};

module.exports = {
  COURSE_STATUSES,
  PDF_KINDS,
  asBoolean,
  validateCoursePayload,
  validateChapterPayload,
  validateVideoPayload,
  validateOrderedIds,
  validatePdfPayload,
  titleFromFileName,
};
