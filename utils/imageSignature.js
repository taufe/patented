const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const MIME_TO_KIND = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/png': 'png',
  'image/x-png': 'png',
  'image/webp': 'webp',
};

const detectImageKind = (buffer) => {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  if (buffer.subarray(0, 3).equals(JPEG_MAGIC)) {
    return { mime: 'image/jpeg', ext: 'jpg', kind: 'jpeg' };
  }

  if (buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    return { mime: 'image/png', ext: 'png', kind: 'png' };
  }

  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp', kind: 'webp' };
  }

  return null;
};

const normalizeDeclaredKind = (mimetype) => MIME_TO_KIND[String(mimetype || '').toLowerCase()] || null;

const isAllowedImage = (file) => {
  const detected = detectImageKind(file && file.buffer);
  const declaredKind = normalizeDeclaredKind(file && file.mimetype);

  if (!detected) {
    return null;
  }

  if (declaredKind && declaredKind !== detected.kind) {
    return null;
  }

  if (!declaredKind) {
    const mime = String(file.mimetype || '').toLowerCase();

    if (mime && mime !== 'application/octet-stream') {
      return null;
    }
  }

  return detected;
};

module.exports = {
  MIME_TO_KIND,
  detectImageKind,
  normalizeDeclaredKind,
  isAllowedImage,
};
