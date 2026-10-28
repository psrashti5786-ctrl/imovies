import { useEffect, useState } from 'react';
import api from '../api';

export default function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/notifications').then((r) => {
      setItems(r.data);
      api.put('/notifications/read').catch(() => {});
    });
  }, []);

  return (
    <>
      <h4 className="fw-bold mb-3">Notifications</h4>
      {items.length === 0 && <p className="text-muted">No notifications yet.</p>}
      {items.map((n) => (
        <div key={n._id} className={`card card-body border-0 shadow-sm mb-2 ${n.read ? '' : 'border-start border-danger border-3'}`}>
          <div>{n.message}</div>
          <div className="small text-muted">{new Date(n.createdAt).toLocaleString('en-IN')}</div>
        </div>
      ))}
    </>
  );
}
