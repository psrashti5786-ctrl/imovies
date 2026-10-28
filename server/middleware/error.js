// 404 for unknown API routes
exports.notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

// Centralized error handler + logging
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${err.message}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
  if (err.code === 11000) {
    return res.status(400).json({ message: `${Object.keys(err.keyValue).join(', ')} already exists` });
  }
  if (err.name === 'VersionError') {
    return res.status(409).json({ message: 'Seats were just updated by someone else, please try again' });
  }
  if (err.name === 'MulterError') return res.status(400).json({ message: err.message });

  res.status(err.status || 500).json({ message: err.message || 'Server error' });
};
