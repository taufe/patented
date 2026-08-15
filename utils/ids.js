const mongoose = require('mongoose');

const isValidId = (id) => Boolean(id) && mongoose.Types.ObjectId.isValid(String(id));

const invalidIdResponse = (res, label = 'ID') =>
  res.status(400).json({
    success: false,
    message: `Invalid ${label}`,
  });

module.exports = {
  isValidId,
  invalidIdResponse,
};
