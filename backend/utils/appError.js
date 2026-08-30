const appError = (statusCode, errMessage, status = "failed") => {
  const error = new Error(errMessage);
  error.statusCode = statusCode;
  error.status = status;
  error.isOperational = true;   // 標記為預期的操作錯誤
  return error;
};

module.exports = appError;