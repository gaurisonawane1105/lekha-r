import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role_id: '1', roll_no: '', department: '', academic_year: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', form);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-logo">
          <div className="icon">📚</div>
          <h1>Join Lekha</h1>
          <p>Create your academic account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="full_name" placeholder="Your name" value={form.full_name} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" name="role_id" value={form.role_id} onChange={handle}>
                <option value="1">Student</option>
                <option value="2">Guide</option>
                <option value="3">HOD</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" name="email" type="email" placeholder="you@college.edu" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handle} required />
          </div>
          {form.role_id === '1' && (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Roll No</label>
                <input className="form-control" name="roll_no" placeholder="e.g. CS2021001" value={form.roll_no} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" name="department" placeholder="e.g. Computer Science" value={form.department} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input className="form-control" name="academic_year" placeholder="e.g. 2024-25" value={form.academic_year} onChange={handle} />
              </div>
            </div>
          )}
          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
            {loading ? <span className="spinner">⟳</span> : null} {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="divider" />
        <div style={{ textAlign: 'center' }}>
          <a href="/login" className="btn btn-ghost btn-sm">Already have an account? Sign In</a>
        </div>
      </div>
    </div>
  );
}
