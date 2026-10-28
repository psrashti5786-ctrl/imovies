const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Theatre name is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    address: { type: String, default: '' },
  },
  { timestamps: true }
);

theatreSchema.index({ city: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
