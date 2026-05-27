import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Files from './pages/Files';
import Meetings from './pages/Meetings';
import Users from './pages/Users';
import { Notifications, AuditLogs } from './pages/NotificationsAndLogs';
import './index.css';
import AIKeywords from './pages/AIKeywords';

function ProtectedLayout({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Lekha</div>
        <div style={{ color: 'var(--text3)', marginTop: 8 }}>Loading...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role_name)) return <Navigate to="/dashboard" replace />;
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'Sora, sans-serif', fontSize: 14 },
            success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
          <Route path="/projects/:id" element={<ProtectedLayout><ProjectDetail /></ProtectedLayout>} />
          <Route path="/files" element={<ProtectedLayout><Files /></ProtectedLayout>} />
          <Route path="/meetings" element={<ProtectedLayout><Meetings /></ProtectedLayout>} />
          <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout roles={['admin']}><Users /></ProtectedLayout>} />
          <Route path="/logs" element={<ProtectedLayout roles={['admin']}><AuditLogs /></ProtectedLayout>} />
          <Route path="/ai-keywords" element={<ProtectedLayout><AIKeywords /></ProtectedLayout>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
