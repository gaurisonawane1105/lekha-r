import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

function ProjectModal({ onClose, onSave, guides }) {
  const [form, setForm] = useState({ group_name: '', project_topic: '', guide_id: '', academic_year: '', department: '' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/projects', form);
      toast.success('Project group created!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Create Project Group</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input className="form-control" name="group_name" placeholder="e.g. Group A - AI Track" value={form.group_name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Project Topic</label>
            <input className="form-control" name="project_topic" placeholder="e.g. Automated Disease Detection using ML" value={form.project_topic} onChange={handle} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assign Guide</label>
              <select className="form-control" name="guide_id" value={form.guide_id} onChange={handle}>
                <option value="">Select Guide</option>
                {guides.map(g => <option key={g.user_id} value={g.user_id}>{g.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <input className="form-control" name="academic_year" placeholder="e.g. 2024-25" value={form.academic_year} onChange={handle} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-control" name="department" placeholder="e.g. Computer Science" value={form.department} onChange={handle} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner">⟳</span> : null} Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddStudentModal({ groupId, onClose, onSave }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/users/students').then(res => setStudents(res.data.data || []));
  }, []);

  const handleAdd = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await API.post(`/projects/${groupId}/students`, { user_id: selected });
      toast.success('Student added to group!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add Student to Group</div>
        <div className="form-group">
          <label className="form-label">Select Student</label>
          <select className="form-control" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Choose student...</option>
            {students.map(s => (
              <option key={s.user_id} value={s.user_id}>
                {s.full_name} ({s.roll_no || s.email})
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={loading || !selected}>
            {loading ? <span className="spinner">⟳</span> : null} Add Student
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [addStudentGroup, setAddStudentGroup] = useState(null);
  const [search, setSearch] = useState('');

  const canCreate = ['admin', 'hod'].includes(user.role_name);
  const canAddStudent = ['admin', 'hod'].includes(user.role_name);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data.data || []);
    } catch (e) { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchProjects();
    API.get('/users/guides').then(res => setGuides(res.data.data || [])).catch(() => {});
  }, []);

  const filtered = projects.filter(p =>
    p.project_topic.toLowerCase().includes(search.toLowerCase()) ||
    p.group_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Project Groups</div>
            <div className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''} found</div>
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New Project
            </button>
          )}
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <input
          className="form-control"
          placeholder="Search by topic or group name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ margin: 0 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ fontSize: 32, color: 'var(--accent)' }}>⟳</span></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="icon">📁</div><p>No projects found</p></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.group_id} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s', borderColor: 'var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div className="flex items-center justify-between mb-4" style={{ marginBottom: 12 }}>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{p.academic_year || '—'}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{p.project_topic}</div>
              <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>{p.group_name}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
                <span>👨‍🏫 {p.guide_name || 'No guide'}</span>
                <span>👩‍🎓 {p.student_count || 0} students</span>
                <span>📄 {p.file_count || 0} files</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/projects/${p.group_id}`)}
                >
                  View Details
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/files?group=${p.group_id}`)}
                >
                  📄 Files
                </button>
                {canAddStudent && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setAddStudentGroup(p.group_id)}
                  >
                    + Student
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <ProjectModal onClose={() => setShowCreate(false)} onSave={fetchProjects} guides={guides} />}
      {addStudentGroup && <AddStudentModal groupId={addStudentGroup} onClose={() => setAddStudentGroup(null)} onSave={fetchProjects} />}
    </div>
  );
}
