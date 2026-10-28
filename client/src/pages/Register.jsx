import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api';
import { setCredentials } from '../store';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', form);
      dispatch(setCredentials(data));
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-8 col-md-5">
        <form className="card card-body border-0 shadow-sm" onSubmit={submit}>
          <h4 className="fw-bold">Create account</h4>
          <input className="form-control mb-2" placeholder="Full name" required value={form.name} onChange={set('name')} />
          <input className="form-control mb-2" type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
          <input className="form-control mb-3" type="password" placeholder="Password (min 6 chars)" required value={form.password} onChange={set('password')} />
          <button className="btn btn-danger" disabled={busy}>{busy ? 'Creating...' : 'Sign up'}</button>
          <p className="small mt-3 mb-0">Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </div>
  );
}
