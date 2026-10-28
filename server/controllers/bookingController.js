const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { releaseExpiredLocks, publicSeats, LOCK_MINUTES } = require('../utils/seats');
const { emitSeats } = require('../socket');

const populateBooking = (q) =>
  q.populate({ path: 'show', select: 'startTime price movie theatre', populate: [{ path: 'movie', select: 'title language poster duration' }, { path: 'theatre', select: 'name city address' }] })
    .populate('payment', 'transactionId method status amount');

// Free seats held by a booking (locked or booked)
function freeSeats(show, seatNos) {
  for (const s of show.seats) {
    if (seatNos.includes(s.seatNo)) {
      s.status = 'available';
      s.lockedBy = null;
      s.lockedUntil = null;
    }
  }
}

// POST /api/bookings  { showId, seats: ["A1","A2"] }
// Locks the seats for LOCK_MINUTES and creates a pending booking
exports.createBooking = asyncHandler(async (req, res) => {
  const { showId, seats } = req.body;
  if (!Array.isArray(seats) || seats.length < 1 || seats.length > 10) {
    return res.status(400).json({ message: 'Select between 1 and 10 seats' });
  }
  const unique = [...new Set(seats)];

  const show = await Show.findById(showId);
  if (!show) return res.status(404).json({ message: 'Show not found' });
  if (show.startTime < new Date()) return res.status(400).json({ message: 'This show has already started' });
  releaseExpiredLocks(show);

  for (const seatNo of unique) {
    const seat = show.seats.find((s) => s.seatNo === seatNo);
    if (!seat) return res.status(400).json({ message: `Seat ${seatNo} does not exist` });
    const mine = seat.status === 'locked' && String(seat.lockedBy) === String(req.user._id);
    if (seat.status === 'booked' || (seat.status === 'locked' && !mine)) {
      return res.status(409).json({ message: `Seat ${seatNo} is no longer available` });
    }
  }

  const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
  for (const s of show.seats) {
    if (unique.includes(s.seatNo)) {
      s.status = 'locked';
      s.lockedBy = req.user._id;
      s.lockedUntil = lockUntil;
    }
  }
  await show.save(); // optimistic concurrency stops double booking

  // expire this user's older pending bookings for the same show
  await Booking.updateMany({ user: req.user._id, show: show._id, status: 'pending' }, { status: 'expired' });

  const booking = await Booking.create({
    user: req.user._id,
    show: show._id,
    seats: unique,
    amount: unique.length * show.price,
    status: 'pending',
    lockExpiresAt: lockUntil,
  });

  emitSeats(show._id, publicSeats(show));
  res.status(201).json(booking);
});

// GET /api/bookings/my?page=&limit=
exports.myBookings = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const filter = { user: req.user._id, status: { $in: ['confirmed', 'cancelled'] } };
  const [bookings, total] = await Promise.all([
    populateBooking(Booking.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Booking.countDocuments(filter),
  ]);
  res.json({ bookings, total, page, pages: Math.ceil(total / limit) || 1 });
});

exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id));
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not your booking' });
  }
  res.json(booking);
});

// PUT /api/bookings/:id/cancel
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not your booking' });
  }
  if (!['confirmed', 'pending'].includes(booking.status)) {
    return res.status(400).json({ message: `Booking is already ${booking.status}` });
  }

  const show = await Show.findById(booking.show);
  if (show) {
    if (show.startTime < new Date()) return res.status(400).json({ message: 'Cannot cancel after the show has started' });
    freeSeats(show, booking.seats);
    await show.save();
    emitSeats(show._id, publicSeats(show));
  }

  if (booking.payment) await Payment.findByIdAndUpdate(booking.payment, { status: 'refunded' });
  booking.status = 'cancelled';
  await booking.save();

  await Notification.create({
    user: booking.user,
    type: 'cancellation',
    message: `Booking for seats ${booking.seats.join(', ')} was cancelled. Rs ${booking.amount} will be refunded.`,
  });
  res.json({ message: 'Booking cancelled and refund initiated', booking });
});

// Admin: GET /api/bookings?page=&limit=
exports.allBookings = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const filter = { status: { $in: ['confirmed', 'cancelled'] } };
  const [bookings, total] = await Promise.all([
    populateBooking(Booking.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)).populate('user', 'name email'),
    Booking.countDocuments(filter),
  ]);
  res.json({ bookings, total, page, pages: Math.ceil(total / limit) || 1 });
});

exports.freeSeats = freeSeats;
