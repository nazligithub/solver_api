class BaseResponse {
  constructor(success, message, data = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  static success(message, data = null, statusCode = 200) {
    return new BaseResponse(true, message, data, statusCode);
  }

  static error(message, data = null, statusCode = 500) {
    return new BaseResponse(false, message, data, statusCode);
  }
}

class ApiError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'ApiError';
  }
}

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(404, message);
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ApiError(400, message);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  const data = error.data || null;

  res.status(statusCode).json(BaseResponse.error(message, data, statusCode));
};

module.exports = {
  BaseResponse,
  ApiError,
  asyncHandler,
  errorHandler
};