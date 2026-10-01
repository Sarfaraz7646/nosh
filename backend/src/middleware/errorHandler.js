function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Request validation failed.',
      errors: Object.values(error.errors).map(({ path, message }) => ({ field: path, message })),
    });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'A supplied identifier or value is invalid.' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }

  const status = error.statusCode || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ message: status >= 500 ? 'An unexpected server error occurred.' : error.message });
}

module.exports = errorHandler;
