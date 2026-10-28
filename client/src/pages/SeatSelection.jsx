import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg, socket, fmtDate, fmtTime } from '../api';

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/shows/${id}`)
      .then((r) => {
        setShow(r.data);
        setSeats(r.data.seats);
        setSelected(r.data.myLocked || []);
      })
      .catch((e) => toast.error(errMsg(e)));

    // real-time seat updates
    socket.connect();
    socket.emit('show:join', id);
    const onUpdate = ({ showId, seats }) => {
      if (showId !== id) return;
      setSeats(seats);
      setSelected((prev) => {
        const taken = prev.filter((no) => seats.find((s) => s.seatNo === no)?.status === 'booked');
        if (taken.length) toast.warn(`Seat ${taken.join(', ')} was just booked by someone else`);
        return prev.filter((no) => !taken.includes(no));
      });
    };
    socket.on('seats:update', onUpdate);
    return () => {
      socket.emit('show:leave', id);
      socket.off('seats:update', onUpdate);
      socket.disconnect();
    };
  }, [id]);

  const rows = useMemo(() => {
    const map = {};
    seats.forEach((s) => {
      const r = s.seatNo[0];
      (map[r] = map[r] || []).push(s);
    });
    return Object.entries(map);
  }, [seats]);

  const toggle = (seat) => {
    const mine = selected.includes(seat.seatNo);
    if (!mine && seat.status !== 'available') return;
    if (!mine && selected.length >= 10) return toast.info('You can book up to 10 seats');
    setSelected(mine ? selected.filter((x) => x !== seat.seatNo) : [...selected, seat.seatNo]);
  };

  const proceed = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/bookings', { showId: id, seats: selected });
      navigate(`/payment/${data._id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (!show) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;

  return (
    <>
      <h4 className="fw-bold mb-0">{show.movie.title}</h4>
      <p className="text-muted">{show.theatre.name}, {show.theatre.city} · {fmtDate(show.startTime)}, {fmtTime(show.startTime)}</p>

      <div className="card card-body border-0 shadow-sm">
        <div className="screen" />
        <p className="text-center small text-muted mb-3">SCREEN THIS WAY</p>
        <div className="seat-grid">
          {rows.map(([row, list]) => (
            <div className="seat-row" key={row}>
              <span className="label">{row}</span>
              {list.map((s, i) => {
                const isSel = selected.includes(s.seatNo);
                const cls = isSel ? 'selected' : s.status;
                return (
                  <div key={s.seatNo} className={`seat ${cls} ${i === 5 ? 'gap' : ''}`} title={s.seatNo} onClick={() => toggle(s)}>
                    {s.seatNo.slice(1)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="legend d-flex justify-content-center gap-3 small mt-3 flex-wrap">
          <span><span className="seat" /> Available</span>
          <span><span className="seat selected" /> Selected</span>
          <span><span className="seat locked" /> Being booked</span>
          <span><span className="seat booked" /> Sold</span>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3 card card-body border-0 shadow-sm flex-row">
        <div>
          <div className="small text-muted">{selected.length ? `Seats: ${selected.join(', ')}` : 'No seats selected'}</div>
          <div className="fw-bold">Rs {selected.length * show.price}</div>
        </div>
        <button className="btn btn-danger" disabled={!selected.length || busy} onClick={proceed}>
          {busy ? 'Holding seats...' : 'Proceed to pay'}
        </button>
      </div>
    </>
  );
}
