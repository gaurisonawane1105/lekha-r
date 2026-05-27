import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="icon">📚</div>
          <h1>Lekha</h1>
          <p>Digital Black Book Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
            {loading ? <span className="spinner">⟳</span> : null}
            {loading ? ' Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider" />
        <div style={{ textAlign: 'center' }}>
          <p className="text-sm text-muted">Don't have an account?</p>
          <a href="/register" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>Create Account</a>
        </div>

        <div style={{ marginTop: 20, padding: 12, background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
          <strong style={{ color: 'var(--text2)' }}>Demo:</strong> admin@lekha.edu / admin123
        </div>
      </div>
    </div>
  );
}
