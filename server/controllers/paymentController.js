const crypto = require('crypto');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { releaseExpiredLocks, publicSeats } = require('../utils/seats');
const { emitSeats } = require('../socket');
const { freeSeats } = require('./bookingController');

// POST /api/payments  { bookingId, method, simulateFailure }
// Mock payment gateway: confirms the booking or releases the seats
exports.pay = asyncHandler(async (req, res) => {
  const { bookingId, method = 'UPI', simulateFailure = false } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not your booking' });
  if (booking.status !== 'pending') return res.status(400).json({ message: `Booking is ${booking.status}` });

  const show = await Show.findById(booking.show);
  if (!show) return res.status(404).json({ message: 'Show not found' });
  releaseExpiredLocks(show);

  // all seats must still be locked by this user
  const stillHeld = booking.seats.every((no) => {
    const s = show.seats.find((x) => x.seatNo === no);
    return s && s.status === 'locked' && String(s.lockedBy) === String(req.user._id);
  });
  if (!stillHeld) {
    booking.status = 'expired';
    await booking.save();
    await show.save();
    emitSeats(show._id, publicSeats(show));
    return res.status(410).json({ message: 'Seat hold expired. Please select seats again.' });
  }

  const transactionId = 'TXN' + crypto.randomBytes(6).toString('hex').toUpperCase();

  if (simulateFailure) {
    const payment = await Payment.create({ booking: booking._id, user: req.user._id, amount: booking.amount, method, status: 'failed', transactionId });
    freeSeats(show, booking.seats);
    await show.save();
    booking.status = 'failed';
    booking.payment = payment._id;
    await booking.save();
    await Notification.create({ user: req.user._id, type: 'payment', message: `Payment of Rs ${booking.amount} failed. Seats were released.` });
    emitSeats(show._id, publicSeats(show));
    return res.status(402).json({ message: 'Payment failed. Your seats have been released.', transactionId });
  }

  for (const s of show.seats) {
    if (booking.seats.includes(s.seatNo)) {
      s.status = 'booked';
      s.lockedBy = null;
      s.lockedUntil = null;
    }
  }
  await show.save();

  const payment = await Payment.create({ booking: booking._id, user: req.user._id, amount: booking.amount, method, status: 'success', transactionId });
  booking.status = 'confirmed';
  booking.payment = payment._id;
  await booking.save();

  await Notification.create({
    user: req.user._id,
    type: 'booking',
    message: `Booking confirmed! Seats ${booking.seats.join(', ')}. Transaction ${transactionId}.`,
  });
  emitSeats(show._id, publicSeats(show));
  res.json({ message: 'Payment successful', booking, payment });
});
