const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const auth = require('../controllers/authController');
const movies = require('../controllers/movieController');
const theatres = require('../controllers/theatreController');
const shows = require('../controllers/showController');
const bookings = require('../controllers/bookingController');
const payments = require('../controllers/paymentController');
const notifications = require('../controllers/notificationController');

// stricter rate limit on login/register
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many attempts, try again later' } });

// optional auth (lets getShow know who is asking, but works for guests)
const optionalAuth = (req, res, next) => (req.headers.authorization ? protect(req, res, next) : next());

// Auth
router.post('/auth/register', authLimiter, validate('name', 'email', 'password'), auth.register);
router.post('/auth/login', authLimiter, validate('email', 'password'), auth.login);
router.get('/auth/me', protect, auth.me);

// Movies
router.get('/movies', movies.listMovies);
router.get('/movies/filters', movies.filterOptions);
router.get('/movies/:id', movies.getMovie);
router.post('/movies', protect, adminOnly, upload.single('poster'), validate('title', 'language', 'duration'), movies.createMovie);
router.put('/movies/:id', protect, adminOnly, upload.single('poster'), movies.updateMovie);
router.delete('/movies/:id', protect, adminOnly, movies.deleteMovie);

// Theatres
router.get('/theatres', theatres.listTheatres);
router.post('/theatres', protect, adminOnly, validate('name', 'city'), theatres.createTheatre);
router.put('/theatres/:id', protect, adminOnly, theatres.updateTheatre);
router.delete('/theatres/:id', protect, adminOnly, theatres.deleteTheatre);

// Shows
router.get('/shows', shows.listShows);
router.get('/shows/:id', optionalAuth, shows.getShow);
router.post('/shows', protect, adminOnly, validate('movie', 'theatre', 'startTime', 'price'), shows.createShow);
router.put('/shows/:id', protect, adminOnly, shows.updateShow);
router.delete('/shows/:id', protect, adminOnly, shows.deleteShow);

// Bookings
router.post('/bookings', protect, validate('showId', 'seats'), bookings.createBooking);
router.get('/bookings/my', protect, bookings.myBookings);
router.get('/bookings', protect, adminOnly, bookings.allBookings);
router.get('/bookings/:id', protect, bookings.getBooking);
router.put('/bookings/:id/cancel', protect, bookings.cancelBooking);

// Payments
router.post('/payments', protect, validate('bookingId'), payments.pay);

// Notifications
router.get('/notifications', protect, notifications.myNotifications);
router.put('/notifications/read', protect, notifications.markAllRead);

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

module.exports = router;
