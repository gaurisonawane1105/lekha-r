import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const STEPS = ['Submitted', 'Guide Review', 'Revisions', 'Approved', 'Archived'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, fRes, mRes] = await Promise.all([
          API.get(`/projects/${id}`),
          API.get(`/files/${id}`),
          API.get(`/meetings/${id}`)
        ]);
        setProject(pRes.data.data);
        setFiles(fRes.data.data || []);
        setMeetings(mRes.data.data || []);
      } catch (e) {
        toast.error('Failed to load project');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, navigate]);

  const getStep = () => {
    if (!files.length) return 0;
    const approved = files.every(f => f.status === 'approved');
    const pending = files.some(f => f.status === 'pending');
    const revision = files.some(f => f.status === 'revision_needed');
    if (project?.status === 'archived') return 4;
    if (approved) return 3;
    if (revision) return 2;
    if (!pending) return 1;
    return 1;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><span className="spinner" style={{ fontSize: 36, color: 'var(--accent)' }}>⟳</span></div>;
  if (!project) return null;

  const currentStep = getStep();

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}>← Back</button>
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">{project.project_topic}</div>
            <div className="page-sub">{project.group_name} • {project.department || 'N/A'} • {project.academic_year || 'N/A'}</div>
          </div>
          <span className={`badge badge-${project.status}`} style={{ fontSize: 13, padding: '6px 14px' }}>{project.status}</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card mb-4">
        <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Project Progress</div>
        <div className="progress-steps">
          {STEPS.map((step, i) => (
            <div key={step} className={`step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
              {i < STEPS.length - 1 && <div className="step-line" />}
              <div className="step-circle">{i < currentStep ? '✓' : i + 1}</div>
              <div className="step-label">{step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview', 'files', 'meetings'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'files' && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--accent)', color: 'white', borderRadius: 10, padding: '1px 6px' }}>{files.length}</span>}
            {t === 'meetings' && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--accent)', color: 'white', borderRadius: 10, padding: '1px 6px' }}>{meetings.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Guide Information</div>
            {project.guide_name ? (
              <>
                <div style={{ fontWeight: 600 }}>{project.guide_name}</div>
                <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{project.guide_email}</div>
              </>
            ) : <div style={{ color: 'var(--text3)' }}>No guide assigned</div>}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Team Members</div>
            {project.students?.length === 0 ? (
              <div style={{ color: 'var(--text3)' }}>No students assigned</div>
            ) : (
              project.students?.map(s => (
                <div key={s.student_id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {s.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.full_name}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>{s.roll_no} • {s.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Quick Stats</div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{files.length}</div><div style={{ color: 'var(--text3)', fontSize: 13 }}>Files uploaded</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{files.filter(f => f.status === 'approved').length}</div><div style={{ color: 'var(--text3)', fontSize: 13 }}>Approved</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>{files.filter(f => f.status === 'pending').length}</div><div style={{ color: 'var(--text3)', fontSize: 13 }}>Pending</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{meetings.length}</div><div style={{ color: 'var(--text3)', fontSize: 13 }}>Meetings logged</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{meetings.filter(m => m.is_verified).length}</div><div style={{ color: 'var(--text3)', fontSize: 13 }}>Meetings verified</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'files' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontWeight: 700 }}>Uploaded Files</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/files?group=${id}`)}>Manage Files →</button>
          </div>
          {files.length === 0 ? (
            <div className="empty-state"><div className="icon">📄</div><p>No files uploaded yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>File Name</th><th>Version</th><th>Uploaded By</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {files.map(f => (
                    <tr key={f.file_id}>
                      <td style={{ fontWeight: 500 }}>{f.file_name}</td>
                      <td>v{f.version}</td>
                      <td>{f.uploaded_by_name}</td>
                      <td style={{ color: 'var(--text3)' }}>{new Date(f.upload_date).toLocaleDateString()}</td>
                      <td><span className={`badge badge-${f.status}`}>{f.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'meetings' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontWeight: 700 }}>Meeting Logs</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/meetings?group=${id}`)}>Manage Meetings →</button>
          </div>
          {meetings.length === 0 ? (
            <div className="empty-state"><div className="icon">📅</div><p>No meeting logs yet</p></div>
          ) : (
            meetings.map(m => (
              <div key={m.meet_id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div style={{ fontWeight: 600 }}>{m.topic}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(m.meet_date).toLocaleDateString()}</span>
                    <span className={`badge ${m.is_verified ? 'badge-approved' : 'badge-pending'}`}>{m.is_verified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
                {m.suggestions && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>{m.suggestions}</div>}
                {m.comment_from_guide && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 6, fontSize: 13, borderLeft: '3px solid var(--accent)' }}>
                    <span style={{ color: 'var(--text3)', fontWeight: 600 }}>Guide: </span>{m.comment_from_guide}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
