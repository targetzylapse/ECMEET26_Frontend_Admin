import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { authAPI } from './api';
import { apiCache } from './apiCache';
import socket from './socket';
import LoginPage      from './LoginPage';
import AdminLayout    from './AdminLayout';
import OverviewPage   from './OverviewPage';
import EventsPage     from './EventsPage';
import UsersPage      from './UsersPage';
import RegistrationsPage from './RegistrationsPage';
import DevPage        from './DevPage';

export const AdminAuthContext = React.createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Real-Time Live Sync ──────────────────────────────────────────────────
  useEffect(() => {
    let refreshTimeout;

    const handleDataUpdate = (data) => {
      console.log('⚡ Live Sync Event:', data.type);
      
      // Invalidate everything in cache since many pages are interconnected
      apiCache.invalidate();
      
      // Debounce the refresh event to prevent multiple rapid reloads (e.g. bulk upload)
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        // Dispatch a global event that components can listen to
        window.dispatchEvent(new CustomEvent('ecmeet_refresh_data', { detail: data }));
      }, 500); 
    };

    socket.on('data-updated', handleDataUpdate);
    return () => {
      socket.off('data-updated', handleDataUpdate);
      clearTimeout(refreshTimeout);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ecmeet_admin_token');
    const saved  = localStorage.getItem('ecmeet_admin_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      authAPI.verify()
        .then(r => {
          const u = r.data.user;
          if (!['coordinator','captain','admin','dev'].includes(u.role)) {
            localStorage.clear(); setUser(null);
          } else {
            setUser(u);
            localStorage.setItem('ecmeet_admin_user', JSON.stringify(u));
          }
        })
        .catch(() => { localStorage.removeItem('ecmeet_admin_token'); localStorage.removeItem('ecmeet_admin_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('ecmeet_admin_token', token);
    localStorage.setItem('ecmeet_admin_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await authAPI.logout().catch(() => {});
    localStorage.removeItem('ecmeet_admin_token');
    localStorage.removeItem('ecmeet_admin_user');
    setUser(null);
  };

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#0a0a0a',
      color: 'white'
    }}>
      <div style={{ 
        width: 64, height: 64, borderRadius: 16, 
        background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        marginBottom: '1.5rem', boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.4)'
      }}>
        <ShieldCheck size={32} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, opacity: 0.8 }}>
        <Loader2 className="animate-spin" size={20} style={{ color: '#f43f5e' }} />
        <span style={{ letterSpacing: '0.05em' }}>INITIALIZING SYSTEM...</span>
      </div>
    </div>
  );

  const isAuth = user && ['coordinator','captain','admin','dev'].includes(user.role);

  return (
    <AdminAuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isAuth ? <Navigate to={user?.role === 'coordinator' || user?.role === 'captain' ? '/registrations' : '/dashboard'} replace /> : <LoginPage />} />
          <Route path="/*" element={isAuth
            ? <AdminLayout>
                <Routes>
                  <Route path="/dashboard"      element={user?.role !== 'captain' ? <OverviewPage /> : <Navigate to="/events" replace />} />
                  <Route path="/events"          element={<EventsPage />} />
                  <Route path="/registrations"   element={<RegistrationsPage />} />
                   <Route path="/users"           element={user?.role !== 'coordinator' ? <UsersPage mode="students" /> : <Navigate to="/registrations" replace />} />
                  <Route path="/staff"           element={<UsersPage mode="staff" />} />
                  {user?.role === 'dev' && <Route path="/dev" element={<DevPage />} />}
                  <Route path="*" element={<Navigate to={user?.role === 'coordinator' || user?.role === 'captain' ? '/registrations' : '/dashboard'} replace />} />
                </Routes>
              </AdminLayout>
            : <Navigate to="/" replace />
          } />
        </Routes>
      </BrowserRouter>
    </AdminAuthContext.Provider>
  );
}
