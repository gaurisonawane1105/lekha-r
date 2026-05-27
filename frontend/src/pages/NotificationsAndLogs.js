import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/notifications')
      .then(res => setNotifs(res.data.data || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async () => {
    await API.put('/notifications/read');
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Notifications</div>
            <div className="page-sub">{unread} unread</div>
          </div>
          {unread > 0 && <button className="btn btn-ghost" onClick={markRead}>Mark all read</button>}
        </div>
      </div>
      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ fontSize: 32, color: 'var(--accent)' }}>⟳</span></div>
          : notifs.length === 0 ? <div className="empty-state"><div className="icon">🔔</div><p>No notifications yet</p></div>
          : notifs.map(n => (
            <div key={n.notif_id} style={{
              padding: '14px 0', borderBottom: '1px solid var(--border)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              opacity: n.is_read ? 0.6 : 1
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'var(--border)' : 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/logs')
      .then(res => setLogs(res.data.data || []))
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, []);

  const actionColors = { CREATE: 'badge-active', UPLOAD: 'badge-approved', REVIEW: 'badge-revision', DELETE: 'badge-rejected' };
  const filtered = logs.filter(l =>
    (l.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.table_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Audit Logs</div>
        <div className="page-sub">System activity history</div>
      </div>
      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <input className="form-control" placeholder="Search by user, action, table..." value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }} />
      </div>
      <div className="card">
        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ fontSize: 32, color: 'var(--accent)' }}>⟳</span></div>
          : filtered.length === 0 ? <div className="empty-state"><div className="icon">📋</div><p>No logs found</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Action</th><th>Table</th><th>Record ID</th><th>Performed By</th><th>Details</th><th>Date</th></tr></thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.audit_id}>
                      <td><span className={`badge ${actionColors[l.action] || 'badge-pending'}`}>{l.action}</span></td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{l.table_name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>#{l.record_id}</td>
                      <td style={{ fontWeight: 500 }}>{l.full_name || 'System'}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.details}>{l.details}</td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(l.action_date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}
