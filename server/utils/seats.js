const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PER_ROW = 10;
const LOCK_MINUTES = 5;

function generateSeats() {
  const seats = [];
  for (const r of ROWS) for (let n = 1; n <= PER_ROW; n++) seats.push({ seatNo: `${r}${n}`, status: 'available' });
  return seats;
}

// Release locks whose time ran out. Returns true if anything changed.
function releaseExpiredLocks(show) {
  const now = Date.now();
  let changed = false;
  for (const s of show.seats) {
    if (s.status === 'locked' && (!s.lockedUntil || s.lockedUntil.getTime() < now)) {
      s.status = 'available';
      s.lockedBy = null;
      s.lockedUntil = null;
      changed = true;
    }
  }
  return changed;
}

// What we send to the browser (hides who locked a seat)
function publicSeats(show) {
  return show.seats.map((s) => ({ seatNo: s.seatNo, status: s.status }));
}

module.exports = { generateSeats, releaseExpiredLocks, publicSeats, LOCK_MINUTES };
