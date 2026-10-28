const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const asyncHandler = require('../utils/asyncHandler');
const { generateSeats, releaseExpiredLocks, publicSeats } = require('../utils/seats');

// GET /api/shows?movie=&theatre=&city=&date=
exports.listShows = asyncHandler(async (req, res) => {
  const { movie, theatre, city, date, all } = req.query;
  const filter = {};
  if (!all) filter.startTime = { $gte: new Date() };
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.startTime = { $gte: start > new Date() ? start : new Date(), $lt: end };
  }
  if (movie) filter.movie = movie;
  if (theatre) filter.theatre = theatre;
  else if (city) {
    const ts = await Theatre.find({ city: new RegExp(`^${city}$`, 'i') }).select('_id');
    filter.theatre = { $in: ts.map((t) => t._id) };
  }

  const shows = await Show.find(filter)
    .sort({ startTime: 1 })
    .populate('movie', 'title language')
    .populate('theatre', 'name city');

  res.json(
    shows.map((s) => ({
      _id: s._id,
      movie: s.movie,
      theatre: s.theatre,
      startTime: s.startTime,
      price: s.price,
      totalSeats: s.seats.length,
      availableSeats: s.seats.filter((x) => x.status !== 'booked').length,
    }))
  );
});

exports.getShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).populate('movie').populate('theatre');
  if (!show) return res.status(404).json({ message: 'Show not found' });
  if (releaseExpiredLocks(show)) await show.save();

  const myLocked = show.seats
    .filter((s) => s.status === 'locked' && String(s.lockedBy) === String(req.user?._id))
    .map((s) => s.seatNo);

  res.json({
    _id: show._id,
    movie: show.movie,
    theatre: show.theatre,
    startTime: show.startTime,
    price: show.price,
    seats: publicSeats(show),
    myLocked,
  });
});

exports.createShow = asyncHandler(async (req, res) => {
  const { movie, theatre, startTime, price } = req.body;
  const [m, t] = await Promise.all([Movie.findById(movie), Theatre.findById(theatre)]);
  if (!m || !t) return res.status(400).json({ message: 'Invalid movie or theatre' });
  if (new Date(startTime) < new Date()) return res.status(400).json({ message: 'Show time must be in the future' });

  const show = await Show.create({ movie, theatre, startTime, price, seats: generateSeats() });
  res.status(201).json(show);
});

exports.updateShow = asyncHandler(async (req, res) => {
  const { startTime, price } = req.body; // seats are never edited directly
  const show = await Show.findByIdAndUpdate(req.params.id, { startTime, price }, { new: true, runValidators: true });
  if (!show) return res.status(404).json({ message: 'Show not found' });
  res.json(show);
});

exports.deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) return res.status(404).json({ message: 'Show not found' });
  if (show.seats.some((s) => s.status === 'booked')) {
    return res.status(400).json({ message: 'Cannot delete a show that has confirmed bookings' });
  }
  await show.deleteOne();
  res.json({ message: 'Show deleted' });
});
