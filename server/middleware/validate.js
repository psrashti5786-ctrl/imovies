// Simple server-side validation: required body fields
module.exports = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => req.body[f] === undefined || req.body[f] === null || String(req.body[f]).trim() === '');
  if (missing.length) return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` });
  next();
};
