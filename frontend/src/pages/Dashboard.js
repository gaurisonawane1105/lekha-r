import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '22' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await API.get('/projects');
        setProjects(projRes.data.data || []);

        if (['admin', 'hod'].includes(user.role_name)) {
          const statsRes = await API.get('/admin/stats');
          setStats(statsRes.data.data);
        }

        // Fetch files for first project if student/guide
        if (projRes.data.data?.length > 0 && ['student', 'guide'].includes(user.role_name)) {
          const firstGroup = projRes.data.data[0].group_id;
          const filesRes = await API.get(`/files/${firstGroup}`);
          setRecentFiles((filesRes.data.data || []).slice(0, 5));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const statusColor = { active: '#6c63ff', completed: '#22c55e', archived: '#6b7280' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <span className="spinner" style={{ fontSize: 32, color: 'var(--accent)' }}>⟳</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Welcome back, {user.full_name.split(' ')[0]} 👋</div>
            <div className="page-sub">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div style={{ padding: '8px 16px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, fontSize: 13, color: 'var(--accent2)', textTransform: 'capitalize' }}>
            {user.role_name}
          </div>
        </div>
      </div>

      {/* Stats for admin/hod */}
      {stats && (
        <div className="stat-grid">
          <StatCard icon="👩‍🎓" label="Students" value={stats.students} color="#6c63ff" />
          <StatCard icon="👨‍🏫" label="Guides" value={stats.guides} color="#a78bfa" />
          <StatCard icon="📁" label="Projects" value={stats.projects} color="#3b82f6" />
          <StatCard icon="📄" label="Files Uploaded" value={stats.files} color="#22c55e" />
          <StatCard icon="⏳" label="Pending Review" value={stats.pending} color="#f59e0b" />
          <StatCard icon="✅" label="Approved" value={stats.approved} color="#22c55e" />
          <StatCard icon="📅" label="Meetings Logged" value={stats.meetings} color="#ec4899" />
        </div>
      )}

      {/* Student/Guide stats */}
      {['student', 'guide'].includes(user.role_name) && (
        <div className="stat-grid">
          <StatCard icon="📁" label="My Projects" value={projects.length} color="#6c63ff" />
          <StatCard icon="📄" label="Files" value={recentFiles.length} color="#3b82f6" />
          <StatCard icon="✅" label="Approved" value={recentFiles.filter(f => f.status === 'approved').length} color="#22c55e" />
          <StatCard icon="⏳" label="Pending" value={recentFiles.filter(f => f.status === 'pending').length} color="#f59e0b" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Projects list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontWeight: 700 }}>Recent Projects</h3>
            <a href="/projects" className="btn btn-ghost btn-sm">View All →</a>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state"><div className="icon">📁</div><p>No projects yet</p></div>
          ) : (
            projects.slice(0, 5).map(p => (
              <div key={p.group_id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.project_topic}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{p.group_name} • {p.guide_name || 'No guide'}</div>
                </div>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent files */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontWeight: 700 }}>Recent Files</h3>
            <a href="/files" className="btn btn-ghost btn-sm">View All →</a>
          </div>
          {recentFiles.length === 0 ? (
            <div className="empty-state"><div className="icon">📄</div><p>No files uploaded yet</p></div>
          ) : (
            recentFiles.map(f => (
              <div key={f.file_id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.file_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>v{f.version} • {new Date(f.upload_date).toLocaleDateString()}</div>
                </div>
                <span className={`badge badge-${f.status}`}>{f.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
