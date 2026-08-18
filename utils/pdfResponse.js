const toDownloadPath = (pdf) => {
  const id = pdf._id;
  const courseId = pdf.courseId;
  const chapterId = pdf.chapterId;
  const videoId = pdf.videoId;

  if (pdf.scope === 'lecture' && videoId) {
    return `/api/videos/${videoId}/pdfs/${id}/download`;
  }

  if (pdf.scope === 'chapter' && courseId && chapterId) {
    return `/api/courses/${courseId}/chapters/${chapterId}/pdfs/${id}/download`;
  }

  return `/api/courses/${courseId}/pdfs/${id}/download`;
};

const toPublicPdf = (pdf, { locked = false } = {}) => {
  const value = pdf.toObject ? pdf.toObject() : { ...pdf };

  return {
    _id: value._id,
    courseId: value.courseId,
    chapterId: value.chapterId || null,
    videoId: value.videoId || null,
    scope: value.scope,
    kind: value.kind,
    title: value.title,
    originalFileName: value.originalFileName,
    fileSize: value.fileSize,
    mimeType: value.mimeType || 'application/pdf',
    available: !locked,
    downloadPath: locked ? null : toDownloadPath(value),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const toAdminPdf = (pdf) => {
  const value = pdf.toObject ? pdf.toObject() : { ...pdf };

  return {
    _id: value._id,
    courseId: value.courseId,
    chapterId: value.chapterId || null,
    videoId: value.videoId || null,
    scope: value.scope,
    kind: value.kind,
    title: value.title,
    originalFileName: value.originalFileName,
    storedFileName: value.storedFileName,
    fileSize: value.fileSize,
    mimeType: value.mimeType || 'application/pdf',
    storageProvider: value.storageProvider,
    published: value.published,
    order: value.order,
    downloadPath: `/api/admin/pdfs/${value._id}/download`,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const contentDisposition = (filename) => {
  const safe = String(filename || 'material.pdf').replace(/[\r\n"]/g, '');
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
};

module.exports = {
  toDownloadPath,
  toPublicPdf,
  toAdminPdf,
  contentDisposition,
};
