const mongoose = require('mongoose');

// Seats live inside the show document so availability is per show
const seatSchema = new mongoose.Schema(
  {
    seatNo: { type: String, required: true }, // e.g. "A1"
    status: { type: String, enum: ['available', 'locked', 'booked'], default: 'available' },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lockedUntil: { type: Date, default: null },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: [true, 'Movie is required'] },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: [true, 'Theatre is required'] },
    startTime: { type: Date, required: [true, 'Show time is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    seats: [seatSchema],
  },
  { timestamps: true, optimisticConcurrency: true }
);

// indexes for show filtering and seat lookups
showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ theatre: 1, startTime: 1 });
showSchema.index({ _id: 1, 'seats.seatNo': 1 });

module.exports = mongoose.model('Show', showSchema);
