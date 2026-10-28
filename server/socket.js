// Real-time seat availability with socket.io
let io = null;

function initSocket(server, corsOrigin) {
  const { Server } = require('socket.io');
  io = new Server(server, { cors: { origin: corsOrigin, credentials: true } });

  io.on('connection', (socket) => {
    socket.on('show:join', (showId) => socket.join(`show:${showId}`));
    socket.on('show:leave', (showId) => socket.leave(`show:${showId}`));
  });
  return io;
}

function emitSeats(showId, seats) {
  if (io) io.to(`show:${showId}`).emit('seats:update', { showId: String(showId), seats });
}

module.exports = { initSocket, emitSeats };
