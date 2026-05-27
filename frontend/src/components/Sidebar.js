import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const navConfig = {
  student: [
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/projects', icon: '📁', label: 'My Projects' },
    { to: '/files', icon: '📄', label: 'Files' },
    { to: '/meetings', icon: '📅', label: 'Meeting Logs' },
  ],
  guide: [
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/projects', icon: '📁', label: 'Project Groups' },
    { to: '/files', icon: '📄', label: 'Review Files' },
    { to: '/meetings', icon: '📅', label: 'Meeting Logs' },
  ],
  hod: [
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/projects', icon: '📁', label: 'All Projects' },
    { to: '/files', icon: '📄', label: 'Files Overview' },
    { to: '/meetings', icon: '📅', label: 'Meetings' },
  ],
  admin: [
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/projects', icon: '📁', label: 'Projects' },
    { to: '/users', icon: '👥', label: 'Users' },
    { to: '/files', icon: '📄', label: 'Files' },
    { to: '/meetings', icon: '📅', label: 'Meetings' },
    { to: '/logs', icon: '📋', label: 'Audit Logs' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    API.get('/notifications').then(res => {
      setNotifCount(res.data.data.filter(n => !n.is_read).length);
    }).catch(() => {});
  }, []);

  const nav = navConfig[user?.role_name] || [];
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📚</div>
        <div>
          <div className="logo-text">Lekha</div>
          <div className="logo-sub">Black Book System</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Navigation</div>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/notifications"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <span className="icon">🔔</span>
          Notifications
          {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
        </NavLink>
      </div>

      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
            <div className="role">{user?.role_name}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout">↩</button>
        </div>
      </div>
    </aside>
  );
}
