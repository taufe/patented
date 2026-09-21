const mongoose = require('mongoose');

const toObjectIdString = (value) => {
  if (value == null || value === '') {
    return '';
  }

  if (typeof value === 'object') {
    const nested = value._id ?? value.id;
    return nested == null ? '' : String(nested).trim();
  }

  return String(value).trim();
};

const isValidId = (id) => {
  const value = toObjectIdString(id);
  return Boolean(value) && mongoose.Types.ObjectId.isValid(value);
};

const invalidIdResponse = (res, label = 'ID') =>
  res.status(400).json({
    success: false,
    code: 'VALIDATION',
    message: `Invalid ${label}`,
  });

module.exports = {
  toObjectIdString,
  isValidId,
  invalidIdResponse,
};
