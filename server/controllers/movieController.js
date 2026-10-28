const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const asyncHandler = require('../utils/asyncHandler');

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function dayRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

// GET /api/movies?q=&genre=&language=&city=&theatre=&date=&page=&limit=
exports.listMovies = asyncHandler(async (req, res) => {
  const { q, genre, language, city, theatre, date } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);

  const filter = {};
  if (q) filter.title = { $regex: escape(q), $options: 'i' };
  if (genre) filter.genre = genre;
  if (language) filter.language = language;

  // theatre / location / date filters go through shows
  if (city || theatre || date) {
    const showFilter = { startTime: { $gte: new Date() } };
    if (date) {
      const { start, end } = dayRange(date);
      showFilter.startTime = { $gte: start, $lt: end };
    }
    if (theatre) showFilter.theatre = theatre;
    else if (city) {
      const theatres = await Theatre.find({ city: new RegExp(`^${escape(city)}$`, 'i') }).select('_id');
      showFilter.theatre = { $in: theatres.map((t) => t._id) };
    }
    const movieIds = await Show.distinct('movie', showFilter);
    filter._id = { $in: movieIds };
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ releaseDate: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Movie.countDocuments(filter),
  ]);
  res.json({ movies, total, page, pages: Math.ceil(total / limit) || 1 });
});

// GET /api/movies/filters  (values for dropdowns)
exports.filterOptions = asyncHandler(async (req, res) => {
  const [genres, languages, cities] = await Promise.all([
    Movie.distinct('genre'),
    Movie.distinct('language'),
    Theatre.distinct('city'),
  ]);
  res.json({ genres: genres.sort(), languages: languages.sort(), cities: cities.sort() });
});

exports.getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

function bodyToMovie(req) {
  const data = { ...req.body };
  if (typeof data.genre === 'string') data.genre = data.genre.split(',').map((g) => g.trim()).filter(Boolean);
  if (req.file) data.poster = `/uploads/${req.file.filename}`;
  return data;
}

exports.createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(bodyToMovie(req));
  res.status(201).json(movie);
});

exports.updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, bodyToMovie(req), { new: true, runValidators: true });
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

exports.deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  await Show.deleteMany({ movie: movie._id });
  res.json({ message: 'Movie and its shows deleted' });
});
