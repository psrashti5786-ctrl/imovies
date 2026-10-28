import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg, fmtDate, fmtTime } from '../api';

export default function Confirmation() {
  const { id } = useParams();
  const [b, setB] = useState(null);

  useEffect(() => {
    api.get(`/bookings/${id}`).then((r) => setB(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [id]);

  if (!b) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;
  const ok = b.status === 'confirmed';

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-7 col-lg-5">
        <div className="card border-0 shadow-sm text-center">
          <div className="card-body p-4">
            <div style={{ fontSize: 48 }}>{ok ? '🎟️' : '⚠️'}</div>
            <h4 className="fw-bold">{ok ? 'Booking confirmed!' : `Booking ${b.status}`}</h4>
            <p className="text-muted small">Booking ID: {b._id}</p>
            <hr />
            <div className="text-start">
              <div className="fw-semibold">{b.show.movie.title}</div>
              <div className="small text-muted">{b.show.theatre.name}, {b.show.theatre.city}</div>
              <div className="small">{fmtDate(b.show.startTime)}, {fmtTime(b.show.startTime)}</div>
              <div className="small">Seats: <b>{b.seats.join(', ')}</b></div>
              <div className="small">Amount: <b>Rs {b.amount}</b></div>
              {b.payment && <div className="small">Transaction: {b.payment.transactionId} ({b.payment.method})</div>}
            </div>
            <div className="d-flex gap-2 justify-content-center mt-4">
              <Link to="/bookings" className="btn btn-dark btn-sm">My bookings</Link>
              <Link to="/" className="btn btn-outline-dark btn-sm">Book another</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
