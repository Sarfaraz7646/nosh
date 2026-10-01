module.exports = function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
