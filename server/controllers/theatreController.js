const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const asyncHandler = require('../utils/asyncHandler');

exports.listTheatres = asyncHandler(async (req, res) => {
  const filter = req.query.city ? { city: new RegExp(`^${req.query.city}$`, 'i') } : {};
  res.json(await Theatre.find(filter).sort({ city: 1, name: 1 }));
});

exports.createTheatre = asyncHandler(async (req, res) => {
  res.status(201).json(await Theatre.create(req.body));
});

exports.updateTheatre = asyncHandler(async (req, res) => {
  const t = await Theatre.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!t) return res.status(404).json({ message: 'Theatre not found' });
  res.json(t);
});

exports.deleteTheatre = asyncHandler(async (req, res) => {
  const t = await Theatre.findByIdAndDelete(req.params.id);
  if (!t) return res.status(404).json({ message: 'Theatre not found' });
  await Show.deleteMany({ theatre: t._id });
  res.json({ message: 'Theatre and its shows deleted' });
});
