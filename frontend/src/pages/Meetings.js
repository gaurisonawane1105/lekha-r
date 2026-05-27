import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

function MeetingModal({ groupId, onClose, onSave }) {
  const [form, setForm] = useState({ group_id: groupId, meet_date: '', topic: '', suggestions: '' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/meetings', form);
      toast.success('Meeting log created!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create meeting');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Log New Meeting</div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Meeting Date</label>
              <input className="form-control" name="meet_date" type="date" value={form.meet_date} onChange={handle} required max={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Topic / Title</label>
              <input className="form-control" name="topic" placeholder="e.g. Literature Review Discussion" value={form.topic} onChange={handle} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Discussion Points & Suggestions</label>
            <textarea className="form-control" name="suggestions" rows={5} placeholder="Describe what was discussed, decisions made, and any action items..." value={form.suggestions} onChange={handle} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner">⟳</span> : null} Save Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewMeetingModal({ meeting, onClose, onSave }) {
  const [comment, setComment] = useState(meeting.comment_from_guide || '');
  const [verified, setVerified] = useState(meeting.is_verified);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await API.put(`/meetings/${meeting.meet_id}/review`, { comment_from_guide: comment, is_verified: verified });
      toast.success('Meeting reviewed!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Review Meeting Log</div>
        <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontWeight: 600 }}>{meeting.topic}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{new Date(meeting.meet_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
          {meeting.suggestions && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)' }}>{meeting.suggestions}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Your Comment</label>
          <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Add feedback for this meeting..." />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--success)' }} />
            <span style={{ fontWeight: 600, color: verified ? 'var(--success)' : 'var(--text2)' }}>
              {verified ? '✅ Mark as Verified' : 'Mark as Verified'}
            </span>
          </label>
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

export default function Meetings() {
  const { user } = useAuth();
  const location = useLocation();
  const queryGroup = new URLSearchParams(location.search).get('group');

  const [projects, setProjects] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(queryGroup || '');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [reviewMeeting, setReviewMeeting] = useState(null);

  const isStudent = user.role_name === 'student';
  const isGuide = user.role_name === 'guide';

  useEffect(() => {
    API.get('/projects').then(res => {
      const projs = res.data.data || [];
      setProjects(projs);
      if (!selectedGroup && projs.length > 0) setSelectedGroup(String(projs[0].group_id));
    });
  }, []);

  const fetchMeetings = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const res = await API.get(`/meetings/${selectedGroup}`);
      setMeetings(res.data.data || []);
    } catch { toast.error('Failed to load meetings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, [selectedGroup]);

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Meeting Logs</div>
            <div className="page-sub">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} logged</div>
          </div>
          {isStudent && selectedGroup && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Log Meeting</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Project Group</label>
          <select className="form-control" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">Select group...</option>
            {projects.map(p => <option key={p.group_id} value={p.group_id}>{p.project_topic} ({p.group_name})</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ fontSize: 32, color: 'var(--accent)' }}>⟳</span></div>
      ) : meetings.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="icon">📅</div>
          <p>{!selectedGroup ? 'Select a project group to view meetings' : 'No meetings logged yet'}</p>
          {isStudent && selectedGroup && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowAdd(true)}>Log First Meeting</button>}
        </div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meetings.map((m, i) => (
            <div key={m.meet_id} className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent2)' }}>
                    #{meetings.length - i}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{m.topic}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {new Date(m.meet_date).toLocaleDateString('en-IN', { dateStyle: 'long' })} • by {m.created_by_name}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${m.is_verified ? 'badge-approved' : 'badge-pending'}`}>
                    {m.is_verified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                  {isGuide && (
                    <button className="btn btn-primary btn-sm" onClick={() => setReviewMeeting(m)}>Review</button>
                  )}
                </div>
              </div>

              {m.suggestions && (
                <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8, fontSize: 14, lineHeight: 1.6, color: 'var(--text2)', marginBottom: 10 }}>
                  {m.suggestions}
                </div>
              )}

              {m.comment_from_guide && (
                <div style={{ padding: '10px 14px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent2)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Guide Feedback</div>
                  <div style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{m.comment_from_guide}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && selectedGroup && <MeetingModal groupId={selectedGroup} onClose={() => setShowAdd(false)} onSave={fetchMeetings} />}
      {reviewMeeting && <ReviewMeetingModal meeting={reviewMeeting} onClose={() => setReviewMeeting(null)} onSave={fetchMeetings} />}
    </div>
  );
}
