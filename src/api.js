import axios from 'axios';
import { apiCache } from './apiCache';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ecmeet_admin_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ecmeet_admin_token');
      localStorage.removeItem('ecmeet_admin_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify')
};

export const adminAPI = {
  getRegistrations: async (eventId, forceRefresh = false) => {
    const key = apiCache.createKey('/admin/registrations', { eventId });
    if (!forceRefresh) {
      const cached = apiCache.get(key);
      if (cached) return { data: cached };
    }
    const r = await api.get('/admin/registrations', { params: { eventId } });
    apiCache.set(key, r.data);
    return r;
  },
  getCoordinatorRegistrations: async (forceRefresh = false) => {
    const key = '/admin/coordinator/registrations';
    if (!forceRefresh) {
      const cached = apiCache.get(key);
      if (cached) return { data: cached };
    }
    const r = await api.get('/admin/coordinator/registrations');
    apiCache.set(key, r.data);
    return r;
  },
  downloadRegistrations: (eventId, filename = 'ECMEET26_Registrations.xlsx') => {
    const token = localStorage.getItem('ecmeet_admin_token');
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const url = `${base}/admin/download/registrations${eventId ? `?eventId=${eventId}` : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    // Use fetch to send auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        a.href = objUrl;
        a.click();
        URL.revokeObjectURL(objUrl);
      });
    document.body.removeChild(a);
  },
  getUsers: async (params, forceRefresh = false) => {
    const key = apiCache.createKey('/admin/users', params);
    if (!forceRefresh) {
      const cached = apiCache.get(key);
      if (cached) return { data: cached };
    }
    const r = await api.get('/admin/users', { params });
    apiCache.set(key, r.data);
    return r;
  },
  downloadUsers: (params, filename = 'ECMEET26_Students.xlsx') => {
    const token = localStorage.getItem('ecmeet_admin_token');
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const qs = new URLSearchParams(params).toString();
    const url = `${base}/admin/download/users?${qs}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error('Download failed');
        return r.blob();
      })
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        a.href = objUrl;
        a.click();
        URL.revokeObjectURL(objUrl);
      })
      .catch(err => {
        console.error('Export error:', err);
        alert('Export failed. Please check if you have the required permissions.');
      });
    document.body.removeChild(a);
  },
  addUserByEmail: async (email, role, name, team = '', assignedEvents = []) => {
    const r = await api.post('/admin/add-user', { email, role, name, team, assignedEvents });
    apiCache.invalidate('/admin/users');
    return r;
  },
  updateRole: async (id, role, team = '', assignedEvents = []) => {
    const r = await api.patch(`/admin/users/${id}/role`, { role, team, assignedEvents });
    apiCache.invalidate('/admin/users');
    return r;
  },
  verifyDev: (password) => api.post('/admin/dev/verify', { password }),
  uploadStudents: async (students) => {
    const r = await api.post('/admin/upload-students', { students });
    apiCache.invalidate('/admin/users');
    return r;
  },
  addEvent: (event) => api.post('/admin/events', event),
  updateEvent: (id, event) => api.put(`/admin/events/${id}`, event),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  reorderEvents: (orderedIds) => api.put('/admin/events-order', { orderedIds }),
  publishEvents: () => api.post('/admin/events/publish'),
  toggleRegistration: (id) => api.put(`/admin/events/${id}/registration`),
  deleteStudent: async (rrn) => {
    const r = await api.delete(`/admin/students/${rrn}`);
    apiCache.invalidate('/admin/users');
    return r;
  },
  updateStudent: async (rrn, data) => {
    const r = await api.patch(`/admin/students/${rrn}`, data);
    apiCache.invalidate('/admin/users');
    return r;
  },
};

export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getActiveUsers: () => api.get('/analytics/active-users'),
  healthCheck: () => api.get('/health')
};

export const eventsAPI = {
  getAll: () => api.get('/events'),
};

export default api;
