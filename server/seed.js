// Fills the database with demo data: run `npm run seed`
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Theatre = require('./models/Theatre');
const Show = require('./models/Show');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const { generateSeats } = require('./utils/seats');

const movies = [
  { title: 'The Last Monsoon', genre: ['Drama', 'Romance'], language: 'Hindi', duration: 142, rating: 'U', description: 'Two strangers stuck in a hill station during the heaviest rains in decades find out what they really want from life.' },
  { title: 'Orbit Zero', genre: ['Sci-Fi', 'Thriller'], language: 'English', duration: 128, rating: 'UA', description: 'A rescue crew races against a failing space station before it falls back to Earth.' },
  { title: 'Gully Kings', genre: ['Action', 'Sports'], language: 'Hindi', duration: 135, rating: 'UA', description: 'A street cricket team from Indore gets one shot at a national tournament.' },
  { title: 'Midnight Chai', genre: ['Comedy'], language: 'Hindi', duration: 118, rating: 'U', description: 'A late-night tea stall becomes the centre of a chaotic neighbourhood mystery.' },
  { title: 'Shadow Protocol', genre: ['Action', 'Thriller'], language: 'English', duration: 140, rating: 'A', description: 'A retired agent is pulled back in when her old team starts disappearing.' },
  { title: 'Kaatru Veliyidai', genre: ['Drama'], language: 'Tamil', duration: 131, rating: 'UA', description: 'A pilot and a doctor rebuild their lives after a storm changes everything.' },
  { title: 'Pixel Pals', genre: ['Animation', 'Family'], language: 'English', duration: 96, rating: 'U', description: 'Three video game characters escape into the real world for one wild weekend.' },
  { title: 'Haveli No. 13', genre: ['Horror'], language: 'Hindi', duration: 124, rating: 'A', description: 'A family inherits an old haveli and quickly learns why nobody stayed there.' },
];

const theatres = [
  { name: 'PVR Treasure Island', city: 'Indore', address: 'MG Road, Indore' },
  { name: 'INOX C21 Mall', city: 'Indore', address: 'AB Road, Indore' },
  { name: 'Cinepolis DB City', city: 'Bhopal', address: 'Arera Hills, Bhopal' },
  { name: 'Carnival Cinemas', city: 'Mumbai', address: 'Andheri West, Mumbai' },
];

async function seed() {
  await Movie.syncIndexes();
  await Promise.all([User, Movie, Theatre, Show, Booking, Payment, Notification].map((m) => m.deleteMany({})));

  await User.create({ name: 'Admin', email: 'admin@imovies.com', password: 'admin123', role: 'admin' });
  await User.create({ name: 'Demo User', email: 'user@imovies.com', password: 'user123' });

  const ms = await Movie.insertMany(movies.map((m, i) => ({ ...m, releaseDate: new Date(Date.now() - i * 7 * 864e5) })));
  const ts = await Theatre.insertMany(theatres);

  const times = [[10, 0], [14, 30], [19, 0], [22, 15]];
  const shows = [];
  for (let d = 0; d < 7; d++) {
    ms.forEach((m, mi) => {
      // each movie plays in 2 theatres, 2 time slots per day
      [ts[mi % ts.length], ts[(mi + 1) % ts.length]].forEach((t, ti) => {
        [times[(mi + ti) % 4], times[(mi + ti + 2) % 4]].forEach(([h, min]) => {
          const start = new Date();
          start.setDate(start.getDate() + d);
          start.setHours(h, min, 0, 0);
          if (start > new Date()) {
            shows.push({ movie: m._id, theatre: t._id, startTime: start, price: [180, 220, 250, 300][(mi + ti) % 4], seats: generateSeats() });
          }
        });
      });
    });
  }
  await Show.insertMany(shows);

  console.log(`Seeded: ${ms.length} movies, ${ts.length} theatres, ${shows.length} shows`);
  console.log('Admin login: admin@imovies.com / admin123');
  console.log('User login:  user@imovies.com / user123');
}

// Auto-seed on first launch when the database is empty
async function seedIfEmpty() {
  if ((await Movie.countDocuments()) === 0) {
    console.log('Empty database, adding demo data...');
    await seed();
  }
}

module.exports = { seed, seedIfEmpty };

if (require.main === module) {
  connectDB()
    .then(seed)
    .then(() => mongoose.disconnect())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
