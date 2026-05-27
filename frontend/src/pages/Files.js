import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

// ─── Review Modal (Guide) ────────────────────────────────────────────────────
function ReviewModal({ file, onClose, onSave }) {
  const [status, setStatus] = useState('approved');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await API.put(`/files/${file.file_id}/review`, { status, comment_from_guide: comment });
      toast.success('Review submitted!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally { setLoading(false); }
  };

  const fmtSize = bytes => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">📋 Review File</div>

        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{file.file_name}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 16 }}>
            <span>👤 {file.uploaded_by_name}</span>
            <span>📁 {file.group_name}</span>
            <span>v{file.version}</span>
            <span>{fmtSize(file.file_size)}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Uploaded: {new Date(file.upload_date).toLocaleString()}
          </div>
        </div>

        {/* Preview / Download */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {file.file_type === '.pdf' && (
            <a
              href={`${BASE_URL}/files/view/${file.file_id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
              onClick={e => {
                e.preventDefault();
                const token = localStorage.getItem('lekha_token');
                fetch(`${BASE_URL}/files/view/${file.file_id}`, { headers: { Authorization: `Bearer ${token}` } })
                  .then(r => r.blob())
                  .then(blob => { window.open(URL.createObjectURL(blob)); });
              }}
            >
              👁 Preview PDF
            </a>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const token = localStorage.getItem('lekha_token');
              fetch(`${BASE_URL}/files/download/${file.file_id}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.blob())
                .then(blob => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = file.file_name; a.click();
                });
            }}
          >
            ⬇ Download
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Your Decision</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: 'approved', label: '✅ Approve', cls: 'btn-success' },
              { val: 'revision_needed', label: '🔁 Revision', cls: 'btn-warning' },
              { val: 'rejected', label: '❌ Reject', cls: 'btn-danger' },
            ].map(s => (
              <button
                key={s.val}
                type="button"
                className={`btn btn-sm ${status === s.val ? s.cls : 'btn-ghost'}`}
                onClick={() => setStatus(s.val)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Feedback / Comment</label>
          <textarea
            className="form-control"
            rows={4}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Write feedback for the student..."
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner">⟳</span> : null} Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal (Student) ──────────────────────────────────────────────────
function UploadModal({ groupId, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await API.post(`/files/upload/${groupId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / e.total))
      });
      toast.success('File uploaded & saved to database!');
      onSave(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setLoading(false); setProgress(0); }
  };

  const fmtSize = b => b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">⬆ Upload Project File</div>
        <div
          className={`file-drop ${drag ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <div className="icon">📂</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop file here or click to browse</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>PDF, DOC, DOCX, PPT, ZIP, Images (max 50MB)</div>
          <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 6 }}>File will be stored securely in the database</div>
          <input ref={inputRef} type="file" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.png,.jpg,.jpeg"
          />
        </div>

        {file && (
          <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>📄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{fmtSize(file.size)}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>✕</button>
          </div>
        )}

        {loading && progress > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: progress + '%', background: 'var(--accent)', transition: 'width 0.3s', borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, textAlign: 'center' }}>{progress}% uploaded</div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !file}>
            {loading ? <span className="spinner">⟳</span> : '⬆'} {loading ? 'Uploading...' : 'Upload to Database'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Files Page ─────────────────────────────────────────────────────────
export default function Files() {
  const { user } = useAuth();
  const location = useLocation();
  const queryGroup = new URLSearchParams(location.search).get('group');

  const [projects, setProjects] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(queryGroup || '');
  const [files, setFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [reviewFile, setReviewFile] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState(user.role_name === 'guide' ? 'pending' : 'myfiles');

  const isGuide = user.role_name === 'guide';
  const isStudent = user.role_name === 'student';

  useEffect(() => {
    API.get('/projects').then(res => {
      const projs = res.data.data || [];
      setProjects(projs);
      if (!selectedGroup && projs.length > 0) setSelectedGroup(String(projs[0].group_id));
    });
    if (isGuide) fetchPendingFiles();
  }, []);

  const fetchPendingFiles = async () => {
    try {
      const res = await API.get('/files/pending');
      setPendingFiles(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchFiles = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const res = await API.get(`/files/${selectedGroup}`);
      setFiles(res.data.data || []);
    } catch { toast.error('Failed to load files'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFiles(); }, [selectedGroup]);

  const handleDownload = (fileId, fileName) => {
    const token = localStorage.getItem('lekha_token');
    fetch(`${BASE_URL}/files/download/${fileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Download failed'));
  };

  const statusDot = { pending: '🟡', approved: '🟢', rejected: '🔴', revision_needed: '🔵' };
  const filtered = statusFilter === 'all' ? files : files.filter(f => f.status === statusFilter);

  const FileTable = ({ data, showGroup = false }) => (
    data.length === 0
      ? <div className="empty-state"><div className="icon">📄</div><p>No files found</p></div>
      : <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                {showGroup && <th>Project</th>}
                <th>Uploaded By</th>
                <th>Version</th>
                <th>Size</th>
                <th>Date</th>
                <th>Status</th>
                <th>Guide Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(f => (
                <tr key={f.file_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.file_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>{f.file_type?.replace('.', '')}</div>
                  </td>
                  {showGroup && (
                    <td style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{f.group_name}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>{f.project_topic?.slice(0, 35)}...</div>
                    </td>
                  )}
                  <td style={{ fontSize: 13 }}>{f.uploaded_by_name}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>v{f.version}</td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                    {f.file_size ? f.file_size > 1048576 ? (f.file_size / 1048576).toFixed(1) + ' MB' : (f.file_size / 1024).toFixed(0) + ' KB' : '—'}
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(f.upload_date).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${f.status}`}>{statusDot[f.status]} {f.status?.replace('_', ' ')}</span></td>
                  <td style={{ maxWidth: 160 }}>
                    {f.comment_from_guide
                      ? <span style={{ fontSize: 12, color: 'var(--text2)' }} title={f.comment_from_guide}>
                          {f.comment_from_guide.slice(0, 40)}{f.comment_from_guide.length > 40 ? '...' : ''}
                        </span>
                      : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(f.file_id, f.file_name)} title="Download">⬇</button>
                      {isGuide && (
                        <button className="btn btn-primary btn-sm" onClick={() => setReviewFile(f)}>Review</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">{isGuide ? '📋 Review Files' : '📄 Project Files'}</div>
            <div className="page-sub">Files are stored securely in the database</div>
          </div>
          {isStudent && selectedGroup && (
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>⬆ Upload File</button>
          )}
        </div>
      </div>

      {/* Guide Tabs */}
      {isGuide && (
        <div className="tabs">
          <button className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
            Pending Review
            <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--warning)', color: '#1f2937', borderRadius: 10, padding: '1px 7px' }}>
              {pendingFiles.filter(f => f.status === 'pending').length}
            </span>
          </button>
          <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All Submissions</button>
        </div>
      )}

      {/* Guide: Pending files across all their groups */}
      {isGuide && tab === 'pending' && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>
            Files Awaiting Your Review
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}>
              ({pendingFiles.filter(f => f.status === 'pending').length} pending)
            </span>
          </div>
          <FileTable data={pendingFiles.filter(f => f.status === 'pending')} showGroup={true} />
        </div>
      )}

      {/* Guide: All submissions */}
      {isGuide && tab === 'all' && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>All File Submissions</div>
          <FileTable data={pendingFiles} showGroup={true} />
        </div>
      )}

      {/* Student: Own group files */}
      {!isGuide && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 260 }}>
              <label className="form-label">Project Group</label>
              <select className="form-control" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                <option value="">Select group...</option>
                {projects.map(p => <option key={p.group_id} value={p.group_id}>{p.project_topic} ({p.group_name})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Filter by Status</label>
              <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revision_needed">Revision Needed</option>
              </select>
            </div>
          </div>

          <div className="card">
            {loading
              ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ fontSize: 32, color: 'var(--accent)' }}>⟳</span></div>
              : !selectedGroup
                ? <div className="empty-state"><div className="icon">📁</div><p>Select a project group to view files</p></div>
                : <FileTable data={filtered} />
            }
            {isStudent && selectedGroup && !loading && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowUpload(true)}>⬆ Upload New File</button>
              </div>
            )}
          </div>
        </>
      )}

      {showUpload && selectedGroup && (
        <UploadModal groupId={selectedGroup} onClose={() => setShowUpload(false)} onSave={() => { fetchFiles(); }} />
      )}
      {reviewFile && (
        <ReviewModal file={reviewFile} onClose={() => setReviewFile(null)} onSave={() => { fetchPendingFiles(); fetchFiles(); }} />
      )}
    </div>
  );
}
