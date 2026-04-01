import React, { useEffect, useState, useContext } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Users as UsersIcon, 
  Activity, 
  Zap, 
  BarChart3, 
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { analyticsAPI } from './api';
import { AdminAuthContext } from './App';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a1a1a', 
        border: '1px solid #262626', 
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: '#a3a3a3' }}>count : {payload[0].value}</div>
      </div>
    );
  }
  return null;
};

export default function OverviewPage() {
  const { user } = useContext(AdminAuthContext);
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ status: 'checking', latency: 0 });

  const checkStatus = () => {
    const start = Date.now();
    analyticsAPI.healthCheck().then(r => {
      setHealth({ 
        status: r.data.status === 'OK' ? 'online' : 'error', 
        latency: Date.now() - start,
        lastChecked: new Date().toLocaleTimeString()
      });
    }).catch(() => setHealth({ status: 'offline', latency: 0, lastChecked: new Date().toLocaleTimeString() }));
  };

  const load = () => {
    Promise.all([
      analyticsAPI.getStats(),
      analyticsAPI.getActiveUsers()
    ]).then(([s, a]) => {
      setStats(s.data);
      setActive(a.data.activeUsers);
    }).catch(() => {}).finally(() => setLoading(false));
    checkStatus();
  };

  useEffect(() => { 
    load(); 
    const t = setInterval(load, 30000); 
    const h = setInterval(checkStatus, 15000);

    const handleSync = () => load();
    window.addEventListener('ecmeet_refresh_data', handleSync);

    return () => { 
      clearInterval(t); 
      clearInterval(h); 
      window.removeEventListener('ecmeet_refresh_data', handleSync);
    }; 
  }, []);

  if (loading) return <div className="empty-state">Loading analytics…</div>;

  const chartData = (stats?.registrationsByEvent || []).map(e => ({
    name: e.eventName?.length > 14 ? e.eventName.slice(0,14)+'…' : e.eventName,
    count: e.count
  }));

  return (
    <div className="fade-in">
      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard 
          icon={UsersIcon} 
          value={stats?.totalUsers || 0} 
          label="Total Students" 
          trend="+12%" 
          trendUp={true} 
          color="#ffffff"
        />
        <StatCard 
          icon={Activity} 
          value={stats?.onlineUsers || 0} 
          label="Online Now" 
          trend="+5%" 
          trendUp={true} 
          color="#10b981"
        />
        <StatCard 
          icon={Zap} 
          value={stats?.totalRegistrations || 0} 
          label="Total Registrations" 
          trend="+8%" 
          trendUp={true} 
          color="#f43f5e"
        />
        <StatCard 
          icon={BarChart3} 
          value={active.length} 
          label="Active (30 min)" 
          trend="-2%" 
          trendUp={false} 
          color="#f59e0b"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Event Registration Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registrations by Event</h3>
            <button className="icon-btn" onClick={load}><RefreshCcw size={16} /></button>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                  dy={16}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                  allowDecimals={false} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#1a1a1a' }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No registration data available.</div>
          )}
        </div>

        {/* Backend Status Widget */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Server</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <div 
                className={health.status === 'online' ? 'pulse-green' : 'pulse-red'}
                style={{ 
                  width: 80, height: 80, borderRadius: '50%', 
                  background: health.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${health.status === 'online' ? '#10b981' : '#f43f5e'}`
                }}
              >
                <Zap size={32} color={health.status === 'online' ? '#10b981' : '#f43f5e'} />
              </div>
              {health.status === 'online' && (
                <div style={{ 
                  position: 'absolute', bottom: 0, right: 0, 
                  background: '#10b981', width: 22, height: 22, 
                  borderRadius: '50%', border: '4px solid var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <RefreshCcw size={10} color="#fff" />
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.25rem', fontWeight: 800, color: '#fff', 
                textTransform: 'uppercase', letterSpacing: '0.05em' 
              }}>
                {health.status === 'online' ? 'Operational' : health.status === 'checking' ? 'Checking' : 'Disconnected'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 600 }}>
                {health.status === 'online' ? `Latency: ${health.latency}ms` : 'Backend is unreachable'}
              </div>
            </div>

            <div style={{ 
              width: '100%', padding: '0.75rem', borderRadius: 12, 
              background: 'var(--surface-hover)', border: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Last Sync</span>
              <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{health.lastChecked || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Table */}
      <div className="card table-card" style={{ marginTop: '1.5rem' }}>
        <div className="table-header">
          <div>
            <h3 className="table-title">Recently Active Users</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{active.length} users in the last 30 minutes</p>
          </div>
          <button className="btn btn-outline" style={{ padding: '0.5rem 0.75rem' }} onClick={load}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
        {active.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem' }}>No active users detected.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>House / Team</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {active.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt="" className="sidebar-user-avatar" style={{ width: 36, height: 36 }} />
                        ) : (
                          <div style={{ 
                            width: 36, height: 36, borderRadius: 10, 
                            background: 'var(--surface-hover)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', 
                            fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' 
                          }}>
                            {u.name?.[0]}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.team ? (
                        <span className={`house-chip house-${u.team}`}>{u.team}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {timeAgo(u.lastLogin)}
                    </td>
                    <td>
                      <span className={`badge ${u.isOnline ? 'badge-green' : 'badge-yellow'}`} style={{ gap: '0.4rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span>
                        {u.isOnline ? 'Active' : 'Away'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, trend, trendUp, color = 'var(--primary)' }) {
  const isNeutral = color === '#ffffff' || color === 'white';
  return (
    <div className="card stat-card" style={{ 
      '--primary': color, 
      borderLeft: isNeutral ? '1px solid var(--border)' : `4px solid ${color}`, 
      padding: '1.5rem' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          width: 44, height: 44, borderRadius: 12, 
          background: 'var(--surface-raised)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', color 
        }}>
          <Icon size={20} />
        </div>
        <div className="stat-trend" style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value.toLocaleString()}</div>
        <div className="stat-label" style={{ fontWeight: 500, marginTop: '0.5rem', fontSize: '0.85rem' }}>{label}</div>
      </div>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return 'Never';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
