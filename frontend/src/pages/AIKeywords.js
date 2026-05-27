import React, { useState, useRef, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

// ── Keyword Chip ────────────────────────────────────────────────────────────
function KeywordChip({ keyword, index }) {
  const colors = [
    { bg: 'rgba(108,99,255,0.18)', border: '#6c63ff', text: '#a78bfa' },
    { bg: 'rgba(34,197,94,0.15)',  border: '#22c55e', text: '#4ade80' },
    { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#60a5fa' },
    { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24' },
    { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#f87171' },
    { bg: 'rgba(167,139,250,0.15)',border: '#a78bfa', text: '#c4b5fd' },
  ];
  const c = colors[index % colors.length];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 999,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 0.3,
        animation: `chipPop 0.35s ease ${index * 0.06}s both`,
        cursor: 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
        e.currentTarget.style.boxShadow = `0 4px 16px ${c.border}44`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ opacity: 0.7, fontSize: 10 }}>#{index + 1}</span>
      {keyword}
    </span>
  );
}

// ── History Row ─────────────────────────────────────────────────────────────
function HistoryRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: 'var(--bg3)', borderRadius: 10,
      border: '1px solid var(--border)', padding: '12px 16px',
      marginBottom: 10,
    }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>📄 {item.file_name}</span>
          <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text3)' }}>
            {new Date(item.uploaded_at).toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: 'rgba(108,99,255,0.18)', color: '#a78bfa',
            borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600,
          }}>
            {item.keywords.length} keywords
          </span>
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {item.keywords.map((kw, i) => <KeywordChip key={i} keyword={kw} index={i} />)}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AIKeywords() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [resultFile, setResultFile] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const inputRef = useRef();

  const ALLOWED = ['.pdf', '.docx', '.txt'];
  const MAX_MB = 20;

  // Load history on mount
  useEffect(() => {
    API.get('/ai/extractions')
      .then(res => setHistory(res.data.data || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const validateFile = (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      toast.error(`Unsupported type. Use PDF, DOCX, or TXT.`);
      return false;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleExtract = async () => {
    if (!file) return toast.error('Please select a file first.');
    setLoading(true);
    setKeywords([]);
    setProgress(0);

    // Fake progress for UX while AI processes
    const interval = setInterval(() => {
      setProgress(p => (p < 85 ? p + Math.random() * 12 : p));
    }, 600);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.post('/ai/extract-keywords', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(interval);
      setProgress(100);
      setKeywords(res.data.keywords || []);
      setResultFile(res.data.file_name || file.name);
      toast.success(`${res.data.keywords.length} keywords extracted!`);

      // Refresh history
      const hist = await API.get('/ai/extractions');
      setHistory(hist.data.data || []);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      toast.error(err.response?.data?.message || 'Extraction failed. Is the AI service running?');
    } finally {
      setLoading(false);
    }
  };

  const fmtSize = (b) =>
    b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB';

  const extIcon = (name) => {
    const ext = name?.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (ext === 'docx') return '📘';
    return '📄';
  };

  return (
    <>
      {/* Inject keyframe animation */}
      <style>{`
        @keyframes chipPop {
          from { opacity: 0; transform: scale(0.75) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div className="page-header">
          <div className="page-title">🤖 AI Keyword Extraction</div>
          <div className="page-sub">Upload a document and let AI extract the most important keywords</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* ── Left: Upload Panel ── */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📂 Upload Document</div>

              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current.click()}
                style={{
                  border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: file ? 'default' : 'pointer',
                  background: drag ? 'rgba(108,99,255,0.07)' : 'var(--bg3)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>
                  {file ? extIcon(file.name) : '☁️'}
                </div>
                {file ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{file.name}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{fmtSize(file.size)}</div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 12 }}
                      onClick={e => { e.stopPropagation(); setFile(null); setKeywords([]); setProgress(0); }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop file here or click to browse</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>PDF, DOCX, TXT — max {MAX_MB}MB</div>
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Progress Bar */}
              {loading && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {progress < 30 ? 'Reading document...' : progress < 60 ? 'Running NLP model...' : progress < 90 ? 'Extracting keywords...' : 'Finalizing...'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--accent2)' }}>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: progress + '%',
                      background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                      borderRadius: 3,
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 10px var(--accent-glow)',
                    }} />
                  </div>
                </div>
              )}

              {/* Extract Button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                onClick={handleExtract}
                disabled={loading || !file}
              >
                {loading
                  ? <><span className="spinner">⟳</span> Extracting...</>
                  : '✨ Extract Keywords'
                }
              </button>
            </div>

            {/* Supported formats info */}
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Supported Formats</div>
              {[
                { icon: '📕', ext: 'PDF', desc: 'Research papers, reports, black books' },
                { icon: '📘', ext: 'DOCX', desc: 'Word documents, project reports' },
                { icon: '📄', ext: 'TXT',  desc: 'Plain text files, notes' },
              ].map(f => (
                <div key={f.ext} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{f.icon}</span>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent2)' }}>{f.ext}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Results Panel ── */}
          <div>
            {keywords.length > 0 ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>✅ Keywords Extracted</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                      from <span style={{ color: 'var(--accent2)' }}>{resultFile}</span>
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(34,197,94,0.15)', color: '#4ade80',
                    border: '1px solid #22c55e', borderRadius: 999,
                    padding: '4px 12px', fontSize: 12, fontWeight: 700,
                  }}>
                    {keywords.length} found
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {keywords.map((kw, i) => (
                    <KeywordChip key={i} keyword={kw} index={i} />
                  ))}
                </div>

                <div style={{
                  marginTop: 20, padding: '12px 14px',
                  background: 'rgba(108,99,255,0.08)', borderRadius: 8,
                  border: '1px solid rgba(108,99,255,0.2)',
                  fontSize: 12, color: 'var(--text3)',
                }}>
                  💾 Keywords saved to your extraction history below
                </div>
              </div>
            ) : (
              <div className="card" style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                minHeight: 300, textAlign: 'center',
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>No keywords yet</div>
                <div style={{ color: 'var(--text3)', fontSize: 13 }}>
                  Upload a document and click<br />"Extract Keywords" to get started
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── History ── */}
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🕘 Extraction History</div>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
              <span className="spinner" style={{ fontSize: 28 }}>⟳</span>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <p>No extractions yet</p>
            </div>
          ) : (
            history.map(item => <HistoryRow key={item.id} item={item} />)
          )}
        </div>
      </div>
    </>
  );
}
