const sendHttpError = (res, error, fallbackMessage) => {
  console.error(error);

  if (error && (error.name === 'CastError' || error.kind === 'ObjectId')) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION',
      message: 'Invalid id',
    });
  }

  if (error && error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION',
      message: error.message,
    });
  }

  const status = error.statusCode || 500;
  return res.status(status).json({
    success: false,
    ...(error.code ? { code: error.code } : status >= 500 ? {} : { code: 'VALIDATION' }),
    message: status >= 500 ? fallbackMessage : error.message || fallbackMessage,
    ...(status >= 500 ? { error: error.message } : {}),
  });
};

const fail = (status, message, code) => {
  const error = new Error(message);
  error.statusCode = status;
  if (code) {
    error.code = code;
  }
  return error;
};

module.exports = {
  sendHttpError,
  fail,
};
