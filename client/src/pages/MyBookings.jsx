import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg, fmtDate, fmtTime } from '../api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/bookings/my', { params: { limit: 50 } })
      .then((r) => setBookings(r.data.bookings))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? The amount will be refunded.')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled, refund initiated');
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const now = new Date();
  const list = bookings.filter((b) => {
    const upcoming = b.show && new Date(b.show.startTime) > now && b.status === 'confirmed';
    return tab === 'upcoming' ? upcoming : !upcoming;
  });

  return (
    <>
      <h4 className="fw-bold mb-3">My bookings</h4>
      <ul className="nav nav-pills mb-3">
        {['upcoming', 'past'].map((t) => (
          <li className="nav-item" key={t}>
            <button className={`nav-link ${tab === t ? 'active bg-danger' : 'text-dark'}`} onClick={() => setTab(t)}>
              {t === 'upcoming' ? 'Upcoming' : 'Past & cancelled'}
            </button>
          </li>
        ))}
      </ul>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : list.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : (
        list.map((b) => (
          <div className="card card-body border-0 shadow-sm mb-2" key={b._id}>
            <div className="d-flex justify-content-between flex-wrap gap-2">
              <div>
                <div className="fw-semibold">{b.show?.movie?.title || 'Show removed'}</div>
                {b.show && (
                  <div className="small text-muted">
                    {b.show.theatre?.name} · {fmtDate(b.show.startTime)}, {fmtTime(b.show.startTime)}
                  </div>
                )}
                <div className="small">Seats {b.seats.join(', ')} · Rs {b.amount}</div>
              </div>
              <div className="text-end">
                <span className={`badge ${b.status === 'confirmed' ? 'text-bg-success' : 'text-bg-secondary'}`}>{b.status}</span>
                {tab === 'upcoming' && (
                  <div><button className="btn btn-link btn-sm text-danger px-0" onClick={() => cancel(b._id)}>Cancel</button></div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
