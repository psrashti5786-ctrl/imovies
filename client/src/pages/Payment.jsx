import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg, fmtDate, fmtTime } from '../api';

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [method, setMethod] = useState('UPI');
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then((r) => {
        if (r.data.status !== 'pending') return navigate(`/confirmation/${id}`, { replace: true });
        setBooking(r.data);
      })
      .catch((e) => toast.error(errMsg(e)));
  }, [id, navigate]);

  // countdown for the seat hold
  useEffect(() => {
    if (!booking) return;
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(booking.lockExpiresAt) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [booking]);

  const pay = async (simulateFailure = false) => {
    setBusy(true);
    try {
      await api.post('/payments', { bookingId: id, method, simulateFailure });
      toast.success('Payment successful! Booking confirmed.');
      navigate(`/confirmation/${id}`, { replace: true });
    } catch (e) {
      toast.error(errMsg(e));
      navigate(`/show/${booking.show._id}`, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  if (!booking) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;
  const { show } = booking;

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-7 col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold">Complete payment</h5>
            <div className={`alert py-2 small ${left < 60 ? 'alert-danger' : 'alert-warning'}`}>
              Seats held for {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
            </div>
            <div className="mb-3">
              <div className="fw-semibold">{show.movie.title}</div>
              <div className="small text-muted">{show.theatre.name}, {show.theatre.city}</div>
              <div className="small text-muted">{fmtDate(show.startTime)}, {fmtTime(show.startTime)}</div>
              <div className="small">Seats: <b>{booking.seats.join(', ')}</b></div>
            </div>
            <ul className="list-group list-group-flush mb-3">
              <li className="list-group-item d-flex justify-content-between px-0">
                <span>{booking.seats.length} x Rs {show.price}</span><span>Rs {booking.amount}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between px-0 fw-bold">
                <span>Total</span><span>Rs {booking.amount}</span>
              </li>
            </ul>
            <label className="form-label small">Payment method</label>
            <select className="form-select mb-3" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>UPI</option><option>Card</option><option>NetBanking</option><option>Wallet</option>
            </select>
            <button className="btn btn-danger w-100 mb-2" disabled={busy || left === 0} onClick={() => pay(false)}>
              {busy ? 'Processing...' : `Pay Rs ${booking.amount}`}
            </button>
            <button className="btn btn-outline-secondary w-100 btn-sm" disabled={busy || left === 0} onClick={() => pay(true)}>
              Simulate failed payment
            </button>
            <p className="small text-muted mt-3 mb-0">Demo gateway: no real money is charged.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
