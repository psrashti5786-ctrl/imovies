import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api';
import { setCredentials } from '../store';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', form);
      dispatch(setCredentials(data));
      toast.success(`Welcome back, ${data.user.name}`);
      navigate(location.state?.from || (data.user.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-8 col-md-5">
        <form className="card card-body border-0 shadow-sm" onSubmit={submit}>
          <h4 className="fw-bold">Login</h4>
          <input className="form-control mb-2" type="email" placeholder="Email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="form-control mb-3" type="password" placeholder="Password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn btn-danger" disabled={busy}>{busy ? 'Logging in...' : 'Login'}</button>
          <p className="small mt-3 mb-1">New here? <Link to="/register">Create an account</Link></p>
          <div className="small text-muted border-top pt-2 mt-2">
            Demo user: user@imovies.com / user123<br />Demo admin: admin@imovies.com / admin123
          </div>
        </form>
      </div>
    </div>
  );
}
