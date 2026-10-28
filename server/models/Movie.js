const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '' },
    genre: [{ type: String, trim: true }],
    language: { type: String, required: [true, 'Language is required'], trim: true },
    duration: { type: Number, required: [true, 'Duration (minutes) is required'], min: 1 },
    rating: { type: String, default: 'UA' }, // U, UA, A
    releaseDate: { type: Date },
    poster: { type: String, default: '' },
  },
  { timestamps: true }
);

// indexes for movie search
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ genre: 1 });
movieSchema.index({ language: 1 });

module.exports = mongoose.model('Movie', movieSchema);
