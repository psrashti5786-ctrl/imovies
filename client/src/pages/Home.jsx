import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api';
import Poster from '../components/Poster';

const empty = { q: '', genre: '', language: '', city: '', date: '' };

export default function Home() {
  const [filters, setFilters] = useState(empty);
  const [options, setOptions] = useState({ genres: [], languages: [], cities: [] });
  const [data, setData] = useState({ movies: [], page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/movies/filters').then((r) => setOptions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = { page, limit: 8 };
      Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
      api.get('/movies', { params })
        .then((r) => setData(r.data))
        .catch((e) => toast.error(errMsg(e)))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [filters, page]);

  const set = (k) => (e) => {
    setPage(1);
    setFilters({ ...filters, [k]: e.target.value });
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="fw-bold mb-1">Movie ticket booking, made simple.</h1>
        <p className="text-muted">Pick a movie, choose a show, grab your seats.</p>
      </div>

      <div className="card card-body mb-4 shadow-sm border-0">
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input className="form-control" placeholder="Search movies..." value={filters.q} onChange={set('q')} />
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={filters.genre} onChange={set('genre')}>
              <option value="">All genres</option>
              {options.genres.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={filters.language} onChange={set('language')}>
              <option value="">All languages</option>
              {options.languages.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={filters.city} onChange={set('city')}>
              <option value="">All cities</option>
              {options.cities.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <input type="date" className="form-control" value={filters.date} onChange={set('date')} />
          </div>
        </div>
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-link btn-sm align-self-start px-0 mt-2" onClick={() => { setFilters(empty); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
      ) : data.movies.length === 0 ? (
        <p className="text-center text-muted py-5">No movies match these filters.</p>
      ) : (
        <div className="row g-3">
          {data.movies.map((m) => (
            <div className="col-6 col-md-4 col-lg-3" key={m._id}>
              <Link to={`/movie/${m._id}`} className="text-decoration-none text-dark movie-card d-block">
                <Poster movie={m} />
                <div className="mt-2 fw-semibold">{m.title}</div>
                <div className="small text-muted">{m.language} · {m.genre.join(', ')}</div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <button className="btn btn-outline-dark btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="align-self-center small">Page {data.page} of {data.pages}</span>
          <button className="btn btn-outline-dark btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
