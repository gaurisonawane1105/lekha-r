import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

function CreateUserModal({ onClose, onSave }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role_id: '1', roll_no: '', department: '', academic_year: '' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/users', form);
      toast.success('User created successfully!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Create New User</div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="full_name" value={form.full_name} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" name="role_id" value={form.role_id} onChange={handle}>
                <option value="1">Student</option>
                <option value="2">Guide</option>
                <option value="3">HOD</option>
                <option value="4">Admin</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" name="email" type="email" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handle} required />
          </div>
          {form.role_id === '1' && (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Roll No</label>
                <input className="form-control" name="roll_no" value={form.roll_no} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" name="department" value={form.department} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input className="form-control" name="academic_year" value={form.academic_year} onChange={handle} />
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner">⟳</span> : null} Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const roleColors = { student: '#6c63ff', guide: '#3b82f6', hod: '#f59e0b', admin: '#ef4444' };

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(res.data.data || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (uid) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await API.delete(`/users/${uid}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role_name === roleFilter) &&
    (u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = { all: users.length };
  ['student', 'guide', 'hod', 'admin'].forEach(r => { counts[r] = users.filter(u => u.role_name === r).length; });

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">User Management</div>
            <div className="page-sub">{users.length} total users</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create User</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([role, count]) => (
          <button key={role} className={`btn btn-sm ${roleFilter === role ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRoleFilter(role)}>
            {role.charAt(0).toUpperCase() + role.slice(1)} ({count})
          </button>
        ))}
      </div>

      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <input className="form-control" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }} />
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ fontSize: 32, color: 'var(--accent)' }}>⟳</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">👥</div><p>No users found</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.user_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, background: roleColors[u.role_name] || '#6c63ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white' }}>
                          {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                    <td>
                      <span className="badge" style={{ background: (roleColors[u.role_name] || '#6c63ff') + '22', color: roleColors[u.role_name] || '#6c63ff' }}>
                        {u.role_name}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.user_id !== user.user_id && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.user_id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSave={fetchUsers} />}
    </div>
  );
}
