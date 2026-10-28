require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || '*';

app.set('trust proxy', 1);
app.use(cors({ origin: CLIENT_URL === '*' ? true : CLIENT_URL.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // request logging

// general API rate limiting
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);
app.use('/api', notFound);

// Serve the built React app (single deploy)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

initSocket(server, CLIENT_URL === '*' ? true : CLIENT_URL.split(','));

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => require('./seed').seedIfEmpty())
  .then(() => server.listen(PORT, () => console.log(`IMovies server running on port ${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
