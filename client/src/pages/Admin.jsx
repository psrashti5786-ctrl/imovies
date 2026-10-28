import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg, fmtDate, fmtTime } from '../api';

const blankMovie = { title: '', description: '', genre: '', language: '', duration: '', rating: 'UA', releaseDate: '' };
const blankTheatre = { name: '', city: '', address: '' };
const blankShow = { movie: '', theatre: '', startTime: '', price: '' };

export default function Admin() {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [movieForm, setMovieForm] = useState(blankMovie);
  const [poster, setPoster] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [theatreForm, setTheatreForm] = useState(blankTheatre);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [showForm, setShowForm] = useState(blankShow);

  const loadMovies = () => api.get('/movies', { params: { limit: 50 } }).then((r) => setMovies(r.data.movies));
  const loadTheatres = () => api.get('/theatres').then((r) => setTheatres(r.data));
  const loadShows = () => api.get('/shows').then((r) => setShows(r.data));
  const loadBookings = () => api.get('/bookings', { params: { limit: 50 } }).then((r) => setBookings(r.data.bookings));

  useEffect(() => {
    Promise.all([loadMovies(), loadTheatres(), loadShows(), loadBookings()]).catch((e) => toast.error(errMsg(e)));
  }, []);

  const run = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  // Movies
  const saveMovie = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(movieForm).forEach(([k, v]) => v !== '' && fd.append(k, v));
    if (poster) fd.append('poster', poster);
    run(async () => {
      if (editingMovie) await api.put(`/movies/${editingMovie}`, fd);
      else await api.post('/movies', fd);
      setMovieForm(blankMovie);
      setPoster(null);
      setEditingMovie(null);
      e.target.reset();
      await loadMovies();
    }, editingMovie ? 'Movie updated' : 'Movie added');
  };
  const editMovie = (m) => {
    setEditingMovie(m._id);
    setMovieForm({
      title: m.title, description: m.description, genre: m.genre.join(', '), language: m.language,
      duration: m.duration, rating: m.rating, releaseDate: m.releaseDate ? m.releaseDate.slice(0, 10) : '',
    });
    window.scrollTo(0, 0);
  };
  const deleteMovie = (id) => window.confirm('Delete this movie and all its shows?') &&
    run(async () => { await api.delete(`/movies/${id}`); await Promise.all([loadMovies(), loadShows()]); }, 'Movie deleted');

  // Theatres
  const saveTheatre = (e) => {
    e.preventDefault();
    run(async () => {
      if (editingTheatre) await api.put(`/theatres/${editingTheatre}`, theatreForm);
      else await api.post('/theatres', theatreForm);
      setTheatreForm(blankTheatre);
      setEditingTheatre(null);
      await loadTheatres();
    }, editingTheatre ? 'Theatre updated' : 'Theatre added');
  };
  const deleteTheatre = (id) => window.confirm('Delete this theatre and all its shows?') &&
    run(async () => { await api.delete(`/theatres/${id}`); await Promise.all([loadTheatres(), loadShows()]); }, 'Theatre deleted');

  // Shows
  const saveShow = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/shows', { ...showForm, startTime: new Date(showForm.startTime).toISOString() });
      setShowForm(blankShow);
      await loadShows();
    }, 'Show added');
  };
  const deleteShow = (id) => window.confirm('Delete this show?') &&
    run(async () => { await api.delete(`/shows/${id}`); await loadShows(); }, 'Show deleted');

  const setM = (k) => (e) => setMovieForm({ ...movieForm, [k]: e.target.value });
  const setT = (k) => (e) => setTheatreForm({ ...theatreForm, [k]: e.target.value });
  const setS = (k) => (e) => setShowForm({ ...showForm, [k]: e.target.value });

  const revenue = bookings.filter((b) => b.status === 'confirmed').reduce((a, b) => a + b.amount, 0);

  return (
    <>
      <h4 className="fw-bold mb-3">Admin dashboard</h4>
      <div className="row g-2 mb-3">
        {[['Movies', movies.length], ['Theatres', theatres.length], ['Upcoming shows', shows.length], ['Revenue', `Rs ${revenue}`]].map(([k, v]) => (
          <div className="col-6 col-md-3" key={k}>
            <div className="card card-body border-0 shadow-sm py-2">
              <div className="small text-muted">{k}</div>
              <div className="fs-5 fw-bold">{v}</div>
            </div>
          </div>
        ))}
      </div>

      <ul className="nav nav-tabs mb-3">
        {['movies', 'theatres', 'shows', 'bookings'].map((t) => (
          <li className="nav-item" key={t}>
            <button className={`nav-link text-capitalize ${tab === t ? 'active' : 'text-dark'}`} onClick={() => setTab(t)}>{t}</button>
          </li>
        ))}
      </ul>

      {tab === 'movies' && (
        <>
          <form className="card card-body border-0 shadow-sm mb-3" onSubmit={saveMovie}>
            <h6>{editingMovie ? 'Edit movie' : 'Add movie'}</h6>
            <div className="row g-2">
              <div className="col-md-6"><input className="form-control" placeholder="Title" required value={movieForm.title} onChange={setM('title')} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Genres (comma separated)" value={movieForm.genre} onChange={setM('genre')} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Language" required value={movieForm.language} onChange={setM('language')} /></div>
              <div className="col-md-3"><input className="form-control" type="number" placeholder="Duration (min)" required value={movieForm.duration} onChange={setM('duration')} /></div>
              <div className="col-md-3">
                <select className="form-select" value={movieForm.rating} onChange={setM('rating')}>
                  <option>U</option><option>UA</option><option>A</option>
                </select>
              </div>
              <div className="col-md-3"><input className="form-control" type="date" value={movieForm.releaseDate} onChange={setM('releaseDate')} /></div>
              <div className="col-12"><textarea className="form-control" rows="2" placeholder="Description" value={movieForm.description} onChange={setM('description')} /></div>
              <div className="col-md-6">
                <label className="form-label small text-muted mb-0">Poster image (optional)</label>
                <input className="form-control" type="file" accept="image/*" onChange={(e) => setPoster(e.target.files[0])} />
              </div>
            </div>
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-danger btn-sm">{editingMovie ? 'Update' : 'Add movie'}</button>
              {editingMovie && <button type="button" className="btn btn-light btn-sm" onClick={() => { setEditingMovie(null); setMovieForm(blankMovie); }}>Cancel</button>}
            </div>
          </form>
          <div className="table-responsive">
            <table className="table table-sm bg-white align-middle">
              <thead><tr><th>Title</th><th>Language</th><th>Genre</th><th /></tr></thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m._id}>
                    <td>{m.title}</td><td>{m.language}</td><td className="small">{m.genre.join(', ')}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-link btn-sm" onClick={() => editMovie(m)}>Edit</button>
                      <button className="btn btn-link btn-sm text-danger" onClick={() => deleteMovie(m._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'theatres' && (
        <>
          <form className="card card-body border-0 shadow-sm mb-3" onSubmit={saveTheatre}>
            <h6>{editingTheatre ? 'Edit theatre' : 'Add theatre'}</h6>
            <div className="row g-2">
              <div className="col-md-4"><input className="form-control" placeholder="Name" required value={theatreForm.name} onChange={setT('name')} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="City" required value={theatreForm.city} onChange={setT('city')} /></div>
              <div className="col-md-5"><input className="form-control" placeholder="Address" value={theatreForm.address} onChange={setT('address')} /></div>
            </div>
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-danger btn-sm">{editingTheatre ? 'Update' : 'Add theatre'}</button>
              {editingTheatre && <button type="button" className="btn btn-light btn-sm" onClick={() => { setEditingTheatre(null); setTheatreForm(blankTheatre); }}>Cancel</button>}
            </div>
          </form>
          <table className="table table-sm bg-white align-middle">
            <thead><tr><th>Name</th><th>City</th><th /></tr></thead>
            <tbody>
              {theatres.map((t) => (
                <tr key={t._id}>
                  <td>{t.name}<div className="small text-muted">{t.address}</div></td><td>{t.city}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-link btn-sm" onClick={() => { setEditingTheatre(t._id); setTheatreForm({ name: t.name, city: t.city, address: t.address }); }}>Edit</button>
                    <button className="btn btn-link btn-sm text-danger" onClick={() => deleteTheatre(t._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'shows' && (
        <>
          <form className="card card-body border-0 shadow-sm mb-3" onSubmit={saveShow}>
            <h6>Add show</h6>
            <div className="row g-2">
              <div className="col-md-4">
                <select className="form-select" required value={showForm.movie} onChange={setS('movie')}>
                  <option value="">Movie...</option>
                  {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <select className="form-select" required value={showForm.theatre} onChange={setS('theatre')}>
                  <option value="">Theatre...</option>
                  {theatres.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.city})</option>)}
                </select>
              </div>
              <div className="col-md-3"><input className="form-control" type="datetime-local" required value={showForm.startTime} onChange={setS('startTime')} /></div>
              <div className="col-md-2"><input className="form-control" type="number" placeholder="Price" required value={showForm.price} onChange={setS('price')} /></div>
            </div>
            <div className="mt-2"><button className="btn btn-danger btn-sm">Add show (80 seats)</button></div>
          </form>
          <div className="table-responsive">
            <table className="table table-sm bg-white align-middle">
              <thead><tr><th>Movie</th><th>Theatre</th><th>When</th><th>Seats left</th><th /></tr></thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s._id}>
                    <td>{s.movie?.title}</td><td className="small">{s.theatre?.name}</td>
                    <td className="small">{fmtDate(s.startTime)} {fmtTime(s.startTime)}</td>
                    <td>{s.availableSeats}/{s.totalSeats}</td>
                    <td className="text-end"><button className="btn btn-link btn-sm text-danger" onClick={() => deleteShow(s._id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'bookings' && (
        <div className="table-responsive">
          <table className="table table-sm bg-white align-middle">
            <thead><tr><th>User</th><th>Movie</th><th>Seats</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.length === 0 && <tr><td colSpan="5" className="text-muted">No bookings yet.</td></tr>}
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className="small">{b.user?.name}<div className="text-muted">{b.user?.email}</div></td>
                  <td className="small">{b.show?.movie?.title}</td>
                  <td className="small">{b.seats.join(', ')}</td>
                  <td>Rs {b.amount}</td>
                  <td><span className={`badge ${b.status === 'confirmed' ? 'text-bg-success' : 'text-bg-secondary'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
