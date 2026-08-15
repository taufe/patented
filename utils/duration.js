const formatDurationLabel = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDurationLabel = (label, fallbackSeconds = 0) => {
  if (Number.isFinite(Number(fallbackSeconds)) && Number(fallbackSeconds) > 0) {
    return Math.floor(Number(fallbackSeconds));
  }

  if (!label) {
    return 0;
  }

  const parts = String(label)
    .trim()
    .replace(/;/g, ':')
    .split(':')
    .map((part) => Number(part));

  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return Math.floor(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  }

  if (parts.length === 2) {
    return Math.floor(parts[0] * 60 + parts[1]);
  }

  return Math.floor(parts[0]);
};

module.exports = {
  formatDurationLabel,
  parseDurationLabel,
  toNumber,
};
