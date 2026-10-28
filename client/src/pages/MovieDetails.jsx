import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg, fmtDate, fmtTime, ymd } from '../api';
import Poster from '../components/Poster';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [date, setDate] = useState(ymd(new Date()));
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);

  const days = useMemo(() => [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  }), []);

  useEffect(() => {
    api.get(`/movies/${id}`).then((r) => setMovie(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get('/movies/filters').then((r) => setCities(r.data.cities)).catch(() => {});
  }, [id]);

  useEffect(() => {
    const params = { movie: id, date };
    if (city) params.city = city;
    api.get('/shows', { params }).then((r) => setShows(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [id, date, city]);

  // group shows by theatre
  const byTheatre = useMemo(() => {
    const map = {};
    shows.forEach((s) => {
      const key = s.theatre._id;
      map[key] = map[key] || { theatre: s.theatre, shows: [] };
      map[key].shows.push(s);
    });
    return Object.values(map);
  }, [shows]);

  if (!movie) return <div className="text-center py-5"><div className="spinner-border text-danger" /></div>;

  return (
    <div className="row g-4">
      <div className="col-12 col-md-4 col-lg-3">
        <Poster movie={movie} />
      </div>
      <div className="col-12 col-md-8 col-lg-9">
        <h2 className="fw-bold">{movie.title}</h2>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <span className="badge text-bg-dark">{movie.rating}</span>
          <span className="badge text-bg-light border">{movie.language}</span>
          <span className="badge text-bg-light border">{movie.duration} min</span>
          {movie.genre.map((g) => <span key={g} className="badge text-bg-light border">{g}</span>)}
        </div>
        <p className="text-muted">{movie.description}</p>

        <h5 className="mt-4">Select a show</h5>
        <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
          {days.map((d) => (
            <button key={ymd(d)} onClick={() => setDate(ymd(d))}
              className={`btn btn-sm ${date === ymd(d) ? 'btn-danger' : 'btn-outline-secondary'}`}>
              {fmtDate(d)}
            </button>
          ))}
        </div>
        <select className="form-select form-select-sm mb-3" style={{ maxWidth: 220 }} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>

        {byTheatre.length === 0 && <p className="text-muted">No shows for this date. Try another day.</p>}
        {byTheatre.map(({ theatre, shows }) => (
          <div className="card card-body mb-2 border-0 shadow-sm" key={theatre._id}>
            <div className="fw-semibold">{theatre.name}</div>
            <div className="small text-muted mb-2">{theatre.city}</div>
            <div className="d-flex flex-wrap gap-2">
              {shows.map((s) => (
                <button key={s._id} className="btn btn-outline-success btn-sm" onClick={() => navigate(`/show/${s._id}`)}
                  disabled={s.availableSeats === 0}>
                  {fmtTime(s.startTime)} <span className="small text-muted">· Rs {s.price} · {s.availableSeats} left</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
