import React, { useEffect, useState, useContext, useRef } from 'react';
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

const CLASSES = [
  "AI&DS 2nd YEAR", "AI&DS 3rd YEAR",
  "IOT 2nd YEAR", "IOT 3rd YEAR",
  "CSE 3rd YEAR", "CSE 2nd YEAR",
  "CYBER 3rd YEAR", "CYBER 2nd YEAR"
];

const SECTIONS = ["A", "B", "C", "D"];

export default function RegistrationsPage() {
  const { user } = useContext(AdminAuthContext);
  const [searchParams] = useSearchParams();
  const initEvent = searchParams.get('event') || '';

  const [regs, setRegs] = useState([]);
  const [events, setEvents] = useState([]);
  const [filterEvent, setFilterEvent] = useState(initEvent);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    team: 'all',
    year: 'all',
    section: 'all',
    sortBy: 'recent'
  });
  const [loading, setLoading] = useState(true);
  const [studentsMap, setStudentsMap] = useState({});
  const [groupByStudent, setGroupByStudent] = useState(false);
  const [expandedRrn, setExpandedRrn] = useState({});

  const load = (forceRefresh = false) => {
    setLoading(true);
    const fetcher = user?.role === 'coordinator'
      ? adminAPI.getCoordinatorRegistrations(forceRefresh)
      : adminAPI.getRegistrations(filterEvent || undefined, forceRefresh);
    fetcher.then(r => setRegs(r.data.registrations || []))
           .catch(() => {})
           .finally(() => setLoading(false));
  };

  useEffect(() => { 
    eventsAPI.getAll().then(r => setEvents(r.data.events || [])).catch(() => {});
    
    // Fetch master student list to resolve "Year" for registrations
    adminAPI.getUsers({ mode: 'students' }).then(r => {
      const map = {};
      (r.data.users || []).forEach(u => {
        if (u.rrn) map[u.rrn] = { year: u.year, department: u.department };
      });
      setStudentsMap(map);
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [filterEvent]);

  // Real-Time Sync Listener
  useEffect(() => {
    const handleSync = () => load();
    window.addEventListener('ecmeet_refresh_data', handleSync);
    return () => window.removeEventListener('ecmeet_refresh_data', handleSync);
  }, [filterEvent, user?.role]);

  const filtered = regs.filter(r => {
    // Search filter
    const q = search.toLowerCase();
    const matchesSearch = !q || (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.rrn?.toLowerCase().includes(q) ||
      r.eventName?.toLowerCase().includes(q)
    );

    // House/Team filter
    const matchesTeam = filters.team === 'all' || r.team === filters.team;

    // Dept/Year filter
    const student = studentsMap[r.rrn];
    const studentYear = student?.year || '';
    const studentDept = student?.department || r.department || '';
    
    let matchesYear = false;
    if (filters.year === 'all') {
      matchesYear = true;
    } else {
      const parts = filters.year.split(' ');
      const filterDept = parts[0] || '';
      const filterYr = parts[1] || '';
      
      const deptMatches = studentDept.toLowerCase().includes(filterDept.toLowerCase());
      const yearMatches = studentYear.toLowerCase().includes(filterYr.toLowerCase());
      
      matchesYear = deptMatches && yearMatches;
      
      // DEBUG: Log when there's a partial match that fails (so user can debug)
      if (!matchesYear && (deptMatches || yearMatches)) {
        console.log(`[Sort Debug] RRN: ${r.rrn} -> Data: [Dept: "${studentDept}", Year: "${studentYear}"] | Filter: [Dept: "${filterDept}", Year: "${filterYr}"] | DeptMatch: ${deptMatches}, YearMatch: ${yearMatches}`);
      }
    }
    // Section filter
    const matchesSection = filters.section === 'all' || r.section === filters.section;

    return matchesSearch && matchesTeam && matchesYear && matchesSection;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'rrn':
        return (a.rrn || '').localeCompare(b.rrn || '');
      case 'team':
        return (a.team || '').localeCompare(b.team || '');
      case 'recent':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <div className="fade-in">
      <div className="card table-card">
        <div className="table-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 className="table-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Event Registrations</h3>
              {!loading && (
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.12)', 
                  color: '#60a5fa', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem', 
                  fontWeight: 800,
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
                }}>
                  {filtered.length} Total
                </div>
              )}
            </div>

            <div className="table-actions responsive-topbar-actions" style={{ gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', height: '42px' }} onClick={() => load(true)} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              <div className="topbar-search-wrap" style={{ maxWidth: 220, height: '42px' }}>
                <Search className="topbar-search-icon" size={16} />
                <input 
                  className="topbar-search-input" 
                  style={{ height: '100%', borderRadius: '12px' }}
                  placeholder="Search regs..."
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              
              {user?.role !== 'coordinator' && (
                <div style={{ position: 'relative', height: '42px' }}>
                  <select
                    className="form-input"
                    value={filterEvent}
                    onChange={e => setFilterEvent(e.target.value)}
                    style={{ 
                      paddingRight: '2.5rem', appearance: 'none', background: 'var(--surface-hover)', 
                      minWidth: 160, height: '100%', borderRadius: '12px', border: '1px solid var(--border)' 
                    }}
                  >
                    <option value="">All Events</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)' }} />
                </div>
              )}

              <button className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', background: 'var(--primary)', height: '42px' }}
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

          <div className="responsive-filter-row" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <div className="responsive-filter-group" style={{ display: 'flex' }}>
              <EmberDropdown 
                value={filters.team}
                onChange={val => setFilters(prev => ({ ...prev, team: val }))}
                options={[
                  { value: 'all', label: 'All Houses' },
                  { value: 'Gryffindor', label: 'Gryffindor' },
                  { value: 'Ravenclaw', label: 'Ravenclaw' },
                  { value: 'Slytherin', label: 'Slytherin' },
                  { value: 'Hufflepuff', label: 'Hufflepuff' }
                ]}
                disabled={user?.role === 'captain'}
              />

              <EmberDropdown 
                value={filters.year}
                onChange={val => setFilters(prev => ({ ...prev, year: val }))}
                options={[
                  { value: 'all', label: 'All Depts' },
                  ...CLASSES.map(c => ({ value: c, label: c }))
                ]}
              />

              <EmberDropdown 
                value={filters.section}
                onChange={val => setFilters(prev => ({ ...prev, section: val }))}
                options={[
                  { value: 'all', label: 'All Sections' },
                  ...SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))
                ]}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600, marginRight: '1rem' }}>
                <input 
                    type="checkbox" 
                    checked={groupByStudent} 
                    onChange={e => setGroupByStudent(e.target.checked)} 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                Group by Student
              </label>

              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                color: 'var(--text-dim)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em' 
              }}>Sort Order</span>
              <EmberDropdown 
                value={filters.sortBy} 
                onChange={val => setFilters(prev => ({ ...prev, sortBy: val }))}
                options={[
                  { value: 'recent', label: 'Sort by Recent' },
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'rrn', label: 'Sort by RRN' },
                  { value: 'team', label: 'Sort by House' }
                ]}
                accent
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '5rem' }}>Loading registrations...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '5rem' }}>No registrations found for this selection.</div>
        ) : (
          <div className="table-responsive">
            {(() => {
              let displayData = filtered;
              if (groupByStudent) {
                const grouped = {};
                filtered.forEach(r => {
                  const key = r.rrn || r.email || `unknown_${r._id}`;
                  if (!grouped[key]) {
                    grouped[key] = { ...r, eventNames: [r.eventName], eventCount: 1, _id: key };
                  } else {
                    grouped[key].eventNames.push(r.eventName);
                    grouped[key].eventCount += 1;
                  }
                });
                displayData = Object.values(grouped);
              }
              return (
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
                  {displayData.map((r, i) => (
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
                    <td style={{ whiteSpace: 'normal', minWidth: '200px' }}>
                      {groupByStudent && r.eventCount > 1 ? (
                        <div>
                          <button 
                            onClick={() => setExpandedRrn(prev => ({...prev, [r.rrn || r.email]: !prev[r.rrn || r.email]}))}
                            className="badge badge-blue" 
                            style={{ cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.02em', border: 'none' }}
                          >
                            {r.eventCount} Events Registered (Click to {expandedRrn[r.rrn || r.email] ? 'Hide' : 'View'})
                          </button>
                          {expandedRrn[r.rrn || r.email] && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                              {r.eventNames.map((en, idx) => (
                                <span key={idx} className="badge badge-blue" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{en}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-blue" style={{ fontSize: '0.7rem', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                          {r.eventName || (r.eventNames && r.eventNames[0])}
                        </span>
                      )}
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
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function EmberDropdown({ value, onChange, options, disabled, accent }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const current = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const clickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ 
      position: 'relative', 
      width: 'fit-content',
      minWidth: '140px',
      zIndex: isOpen ? 1000 : 50,
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <div 
        className="form-input" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left', 
          border: accent ? '1px solid var(--primary)' : '1px solid var(--border)', 
          background: accent ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface-hover)',
          padding: '0.65rem 1rem',
          paddingRight: '0.75rem',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          gap: '1rem'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{current.label}</span>
        <ChevronDown size={14} style={{ 
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          opacity: 0.6
        }} />
      </div>

      {isOpen && (
        <div className="fade-in no-scrollbar" style={{
          position: 'absolute', top: 'calc(100% + 0.4rem)', left: 0, 
          minWidth: '100%',
          width: 'max-content',
          background: 'rgba(15, 15, 15, 0.95)', 
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '0.4rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.85rem', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.85rem',
                transition: 'all 0.15s ease',
                background: value === opt.value ? 'rgba(var(--primary-rgb), 0.12)' : 'transparent',
                color: value === opt.value ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                marginBottom: '1px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={e => {
                if (value !== opt.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={e => {
                if (value !== opt.value) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }
              }}
            >
              <span style={{ fontWeight: value === opt.value ? 700 : 500 }}>{opt.label}</span>
              {value === opt.value && (
                <div style={{ 
                  width: 3, height: 3, borderRadius: '50%', 
                  background: 'var(--primary)', marginLeft: '1rem',
                  boxShadow: '0 0 6px var(--primary)'
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
