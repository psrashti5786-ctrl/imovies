import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store';
import api from '../api';

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return setUnread(0);
    api.get('/notifications').then((r) => setUnread(r.data.filter((n) => !n.read).length)).catch(() => {});
  }, [user, location.pathname]);

  useEffect(() => setOpen(false), [location.pathname]);

  const doLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-md bg-white border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand brand" to="/">I<span>Movies</span></Link>
        <button className="navbar-toggler" onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><NavLink className="nav-link" to="/" end>Movies</NavLink></li>
            {user && <li className="nav-item"><NavLink className="nav-link" to="/bookings">My Bookings</NavLink></li>}
            {user?.role === 'admin' && <li className="nav-item"><NavLink className="nav-link" to="/admin">Admin</NavLink></li>}
          </ul>
          <div className="d-flex gap-2 align-items-center">
            {user ? (
              <>
                <Link to="/notifications" className="btn btn-light position-relative">
                  🔔
                  {unread > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{unread}</span>}
                </Link>
                <span className="text-muted small">Hi, {user.name}</span>
                <button className="btn btn-outline-dark btn-sm" onClick={doLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-dark btn-sm" to="/login">Login</Link>
                <Link className="btn btn-danger btn-sm" to="/register">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
