const PROVIDERS = ['external', 'vimeo', 'cloudinary', 's3', 'mux'];

const detectProvider = (videoUrl = '', provided) => {
  if (PROVIDERS.includes(provided)) {
    return provided;
  }

  const url = String(videoUrl).toLowerCase();

  if (url.includes('vimeo.com') || url.includes('player.vimeo.com')) {
    return 'vimeo';
  }

  if (url.includes('cloudinary.com')) {
    return 'cloudinary';
  }

  if (url.includes('mux.com')) {
    return 'mux';
  }

  if (url.includes('amazonaws.com') || url.includes('cloudfront.net')) {
    return 's3';
  }

  return 'external';
};

const extractProviderAssetId = (videoUrl = '', provider) => {
  if (provider !== 'vimeo') {
    return '';
  }

  const match = String(videoUrl).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : '';
};

module.exports = {
  PROVIDERS,
  detectProvider,
  extractProviderAssetId,
};
