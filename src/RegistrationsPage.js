import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { adminAPI, eventsAPI } from './api';
import { AdminAuthContext } from './App';

export default function RegistrationsPage() {
  const { user } = useContext(AdminAuthContext);
  const [searchParams] = useSearchParams();
  const initEvent = searchParams.get('event') || '';

  const [regs, setRegs] = useState([]);
  const [events, setEvents] = useState([]);
  const [filterEvent, setFilterEvent] = useState(initEvent);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (forceRefresh = false) => {
    setLoading(true);
    const fetcher = user?.role === 'coordinator'
      ? adminAPI.getCoordinatorRegistrations(forceRefresh)
      : adminAPI.getRegistrations(filterEvent || undefined, forceRefresh);
    fetcher.then(r => setRegs(r.data.registrations || []))
           .catch(() => {})
           .finally(() => setLoading(false));
  };

  useEffect(() => { eventsAPI.getAll().then(r => setEvents(r.data.events || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [filterEvent]);

  // Real-Time Sync Listener
  useEffect(() => {
    const handleSync = () => load();
    window.addEventListener('ecmeet_refresh_data', handleSync);
    return () => window.removeEventListener('ecmeet_refresh_data', handleSync);
  }, [filterEvent, user?.role]);

  const filtered = regs.filter(r => {
    const q = search.toLowerCase();
    if (!q) return true;
    return r.name?.toLowerCase().includes(q) ||
           r.email?.toLowerCase().includes(q) ||
           r.rrn?.toLowerCase().includes(q) ||
           r.eventName?.toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div className="card table-card">
        <div className="table-header">
          <div>
            <h3 className="table-title">Event Registrations</h3>
          </div>
          <div className="table-actions">
            {/* Refresh Button */}
            <button className="btn btn-outline" style={{ padding: '0.6rem 1rem', gap: '0.5rem' }} onClick={() => load(true)} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <div className="topbar-search-wrap" style={{ maxWidth: 280 }}>
              <Search className="topbar-search-icon" size={16} />
              <input 
                className="topbar-search-input" 
                placeholder="Search registrations..."
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            
            {user?.role !== 'coordinator' && (
              <div style={{ position: 'relative' }}>
                <select
                  className="form-input"
                  value={filterEvent}
                  onChange={e => setFilterEvent(e.target.value)}
                  style={{ paddingRight: '2.5rem', appearance: 'none', background: 'var(--surface)', minWidth: 160 }}
                >
                  <option value="">All Events</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)' }} />
              </div>
            )}

            <button className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}
              onClick={() => {
                const eventName = events.find(e => e.id === filterEvent)?.name || 'All';
                const safeName = eventName.replace(/[^a-z0-9]/gi, '_');
                adminAPI.downloadRegistrations(filterEvent || undefined, `ECMEET26_${safeName}_reg.xlsx`);
              }}>
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '5rem' }}>Loading registrations...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '5rem' }}>No registrations found for this selection.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>RRN</th>
                  <th>House</th>
                  <th style={{ minWidth: '150px' }}>Dept / Sec</th>
                  <th>Contact</th>
                  <th style={{ minWidth: '120px' }}>Event Name</th>
                  <th>Registered</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r._id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: '40px' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {r.profilePicture ? (
                          <img src={r.profilePicture} alt="" className="sidebar-user-avatar" style={{ width: 32, height: 32 }} />
                        ) : (
                          <div style={{ 
                            width: 32, height: 32, borderRadius: 8, 
                            background: 'var(--surface-hover)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', 
                            fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' 
                          }}>
                            {r.name?.[0]}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>{r.rrn || '—'}</td>
                    <td>
                      {r.team ? (
                        <span className={`house-chip house-${r.team}`} style={{ fontSize: '0.65rem' }}>{r.team}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {r.department || '—'} / {r.section || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>{r.contactNumber || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.7rem', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                        {r.eventName}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <span className={`badge ${
                        r.status === 'confirmed' ? 'badge-green' : 
                        r.status === 'cancelled' ? 'badge-red' : 'badge-yellow'
                      }`} style={{ textTransform: 'capitalize', minWidth: 80, justifyContent: 'center' }}>
                        {r.status}
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
