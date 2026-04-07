import React, { useEffect, useState, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users as UsersIcon, 
  Search, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  MoreVertical,
  RefreshCw,
  Trash2,
  RotateCcw,
  ChevronDown,
  ArrowDownAZ,
  Hash,
  Home,
  Star,
  Zap
} from 'lucide-react';
import { adminAPI } from './api';
import { AdminAuthContext } from './App';

export default function UsersPage({ mode = 'students' }) {
  const { user } = useContext(AdminAuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [newTeam, setNewTeam] = useState('Gryffindor');
  const [selectedUser, setSelectedUser] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    team: user?.role === 'captain' ? user.team : 'all',
    year: 'all',
    section: 'all',
    sortBy: 'rrn'
  });

  useEffect(() => {
    // In staff mode, we disable house filtering and show all staff
    if (mode === 'staff') {
      setFilters(prev => ({ ...prev, team: 'all' }));
    } else {
      // Revert to all if coming from staff? Or keep previous.
      // Usually, let's keep previous.
    }
  }, [mode]);

  const load = (forceRefresh = false) => {
    setLoading(true);
    adminAPI.getUsers({ ...filters, mode }, forceRefresh)
      .then(r => setUsers(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDeleteStudent = async (e, rrn) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this student profile?')) return;
    try {
      await adminAPI.deleteStudent(rrn);
      load(true); // force refresh on mutation
    } catch (err) {
      alert('Failed to delete student.');
    }
  };

  useEffect(() => {
    load();
  }, [filters.team, filters.year, filters.section, filters.sortBy, mode]); // Auto reload on dropdown change or mode change

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  // Debounced search for the text input
  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Real-Time Sync Listener
  useEffect(() => {
    const handleSync = () => load();
    window.addEventListener('ecmeet_refresh_data', handleSync);
    return () => window.removeEventListener('ecmeet_refresh_data', handleSync);
  }, [filters, mode]);

  const handleRoleUpdate = async (e) => {
    e.stopPropagation(); // prevent modal from opening
    if (!editingRole || !newRole) return;
    await adminAPI.updateRole(editingRole.userId, newRole, newRole === 'captain' ? newTeam : '');
    setEditingRole(null);
    load(true); // force refresh on mutation
  };

  // Department / Class Logic
  const CLASSES = [
    "AI&DS 2nd YEAR", "AI&DS 3rd YEAR",
    "IOT 2nd YEAR", "IOT 3rd YEAR",
    "CSE 3rd YEAR", "CSE 2nd YEAR",
    "CYBER 3rd YEAR", "CYBER 2nd YEAR"
  ];

  const SECTIONS = ["A", "B", "C", "D"];

  const hideSectionColumn = filters.year.includes("IOT") || filters.year.includes("CYBER");

  const openUserDetail = (u) => {
    setSelectedUser(u);
  };

  const handleExport = () => {
    const parts = [];
    if (filters.team && filters.team !== 'all') parts.push(filters.team);
    if (filters.year && filters.year !== 'all') parts.push(filters.year);
    if (filters.section && filters.section !== 'all') parts.push(filters.section);
    
    const details = parts.join('_').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `ecmeet26${details ? `_${details}` : ''}_studentlist.xlsx`;
    adminAPI.downloadUsers(filters, fileName);
  };

  return (
    <div className="fade-in">
      <div className="card table-card">
        <div className="table-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <h3 className="table-title" style={{ margin: 0 }}>{mode === 'students' ? 'Students Details' : 'Users'}</h3>
              {!loading && (
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  color: '#3b82f6', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap'
                }}>
                  {users.length} Total
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ padding: '0.6rem 1rem', gap: '0.5rem' }} onClick={() => load(true)} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              {mode === 'students' && (
                <button className="btn btn-outline" style={{ padding: '0.6rem 1rem' }} onClick={handleExport}>
                   Export CSV
                </button>
              )}
            </div>
          </div>
          
          <div className="table-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            {/* Search */}
            <div className="topbar-search-wrap" style={{ maxWidth: 'none' }}>
              <Search className="topbar-search-icon" size={16} />
              <input 
                className="topbar-search-input" 
                placeholder="Search name, email, RRN..."
                value={filters.search} 
                onChange={handleSearchChange} 
              />
            </div>

            {/* House Filter (Only for students) */}
            {mode === 'students' && (
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
            )}

            {/* Dept Filter (Only for students) */}
            {mode === 'students' && (
              <EmberDropdown 
                value={filters.year}
                onChange={val => setFilters(prev => ({ ...prev, year: val }))}
                options={[
                  { value: 'all', label: 'All Depts' },
                  ...CLASSES.map(c => ({ value: c, label: c }))
                ]}
              />
            )}

            {/* Section Filter (Only for students) */}
            {(mode === 'students' && !hideSectionColumn) && (
              <EmberDropdown 
                value={filters.section}
                onChange={val => setFilters(prev => ({ ...prev, section: val }))}
                options={[
                  { value: 'all', label: 'All Sections' },
                  ...SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))
                ]}
              />
            )}

            {/* Sorting (Only for students) */}
            {mode === 'students' && (
              <EmberDropdown 
                value={filters.sortBy} 
                onChange={val => setFilters(prev => ({ ...prev, sortBy: val }))}
                options={[
                  { value: 'name', label: 'Sort by Name' },
                  { value: 'rrn', label: 'Sort by RRN' },
                  { value: 'team', label: 'Sort by Team' },
                  { value: 'event', label: 'Sort by Event Count' },
                  { value: 'reveal', label: 'Sort by House Reveal' }
                ]}
                accent
              />
            )}
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '5rem' }}>Loading user directory...</div>
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: '5rem' }}>No users found matching your search.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>S.no</th>
                  <th>Student_Name</th>
                  <th>RRN</th>
                  <th>Email</th>
                  {mode === 'staff' ? (
                    // In Staff mode, Team is only relevant if there are captains
                    <th>Team</th>
                  ) : <th>Team</th>}
                  
                  {mode === 'students' && (
                    <>
                      <th>Year</th>
                      <th>Dept</th>
                      {!hideSectionColumn && <th>Section</th>}
                      <th>House Reveal</th>
                      <th style={{ textAlign: 'center' }}>Events</th>
                      <th>Status</th>
                      {user?.role === 'dev' && <th style={{ textAlign: 'center' }}>Actions</th>}
                    </>
                  )}
                  {mode === 'staff' && (
                    <>
                      <th>Role</th>
                      <th>Events</th>
                      {user?.role === 'dev' && <th style={{ textAlign: 'center' }}>Actions</th>}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr 
                    key={u._id || i} 
                    onClick={() => mode === 'students' && openUserDetail(u)} 
                    style={{ cursor: mode === 'students' ? 'pointer' : 'default' }}
                  >
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ 
                            width: 28, height: 28, borderRadius: '50%', 
                            background: 'var(--surface-hover)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', 
                            fontWeight: 700, fontSize: '0.7rem'
                          }}>
                            {u.name?.[0]}
                          </div>
                        )}
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <code>
                        {u.rrn || (u.email?.includes('@crescent.education') ? u.email.split('@')[0].toUpperCase() : '—')}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.email}</td>
                    <td>
                      {mode === 'staff' ? (
                        u.role === 'captain' && u.team ? (
                          <span className={`house-chip house-${u.team}`} style={{ fontSize: '0.65rem' }}>{u.team}</span>
                        ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      ) : (
                        u.team ? (
                          <span className={`house-chip house-${u.team}`} style={{ fontSize: '0.65rem' }}>{u.team}</span>
                        ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    
                    {mode === 'staff' && (
                      <>
                        <td>
                          <span className="badge" style={{ 
                            background: roleBg(u.role, 0.15), 
                            color: roleColor(u.role),
                            fontSize: '0.65rem'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.role === 'coordinator' ? (
                            <div style={{ fontSize: '0.75rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                {u.assignedEvents?.join(', ') || 'None assigned'}
                              </div>
                              <div style={{ color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                                ({u.totalAssignedRegistrations || 0} Registrations)
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        {user?.role === 'dev' && (
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="icon-btn" 
                              style={{ color: 'var(--primary)', marginRight: '0.5rem' }} 
                              onClick={(e) => { e.stopPropagation(); setEditingRole({ userId: u._id, role: u.role }); setNewRole(u.role); setNewTeam(u.team || 'Gryffindor'); }}
                              title="Edit Role"
                            >
                              <Shield size={14} />
                            </button>
                          </td>
                        )}
                      </>
                    )}

                    {mode === 'students' && (
                      <>
                        <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.year || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{u.department || '—'}</td>
                        {!hideSectionColumn && <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.section || '—'}</td>}
                        <td>
                          {u.houseRevealed ? (
                            <span className="badge badge-green" style={{ fontSize: '0.65rem', gap: '0.25rem' }}>
                              <Shield size={10} /> Done
                            </span>
                          ) : (
                            <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{u.registrationCount || 0}</span>
                        </td>
                        <td>
                          <span className={`badge ${u.isOnline ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                            {u.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        {user?.role === 'dev' && (
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="icon-btn" 
                              style={{ color: 'var(--primary)', marginRight: '0.5rem' }} 
                              onClick={(e) => { e.stopPropagation(); setEditingRole({ userId: u._id, role: u.role }); setNewRole(u.role); setNewTeam(u.team || 'Gryffindor'); }}
                              title="Edit Role"
                            >
                              <Shield size={14} />
                            </button>
                            <button 
                              className="icon-btn" 
                              style={{ color: 'var(--error)' }} 
                              onClick={(e) => handleDeleteStudent(e, u.rrn)} 
                              title="Delete Student"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedUser(null)} style={{
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(12px) saturate(180%)', 
          zIndex: 9999,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2rem'
        }}>
          <div className="card modal-content-anim no-scrollbar" onClick={e => e.stopPropagation()} style={{
            maxWidth: 650, width: '100%', maxHeight: '85vh', overflowY: 'auto',
            background: '#121212', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)', // Light source from top
            boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255,255,255,0.02)',
            borderRadius: '28px',
            position: 'relative',
            color: 'var(--text)'
          }}>
            <div style={{ 
              position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10
            }}>
              <button 
                className="icon-btn" 
                onClick={() => setSelectedUser(null)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '3rem 2.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random`} alt="" style={{ 
                    width: 100, height: 100, borderRadius: '28px', objectFit: 'cover',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                    border: '4px solid rgba(255,255,255,0.05)'
                  }} />
                  <div style={{ 
                    position: 'absolute', bottom: -5, right: -5,
                    width: 24, height: 24, borderRadius: '50%',
                    background: selectedUser.isOnline ? 'var(--success)' : 'var(--text-dim)',
                    border: '3px solid #141414'
                  }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                    {selectedUser.name}
                  </h2>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    {selectedUser.email}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span className={`house-chip house-${selectedUser.team}`} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                      {selectedUser.team || 'No House'}
                    </span>
                    <span className="badge" style={{ 
                      background: roleBg(selectedUser.role, 0.2), 
                      color: roleColor(selectedUser.role),
                      padding: '0.4rem 1rem',
                      fontSize: '0.8rem'
                    }}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
                <div className="detail-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1rem', display: 'block' }}>Academic Record</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>RRN</span>
                      <strong style={{ color: 'var(--text)' }}>{selectedUser.rrn || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Year</span>
                      <strong style={{ color: 'var(--text)' }}>{selectedUser.year || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Department</span>
                      <strong style={{ color: 'var(--text)' }}>{selectedUser.department || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Section</span>
                      <strong style={{ color: 'var(--text)' }}>{selectedUser.section || '—'}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="detail-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1rem', display: 'block' }}>System Status</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Login Activity</span>
                      {selectedUser.hasLoggedIn ? (
                        <span style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                           <ShieldCheck size={14} /> ACTIVE
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>INACTIVE</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>House Reveal</span>
                      <span className={`badge ${selectedUser.houseRevealed ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '0.7rem' }}>
                        {selectedUser.houseRevealed ? 'REVEALED' : 'PENDING'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                      <strong style={{ color: 'var(--text)' }}>{selectedUser.contactNumber || '—'}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Last Login</span>
                      <strong style={{ color: 'var(--text)', fontSize: '0.8rem' }}>
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '20px', 
                padding: '2rem', 
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Registered Events</h4>
                  <span className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    {selectedUser.registrationCount || 0} Total
                  </span>
                </div>
                
                {selectedUser.eventNames && selectedUser.eventNames.length > 0 ? (
                  <div style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', display: 'grid', gap: '0.75rem' }}>
                    {selectedUser.eventNames.map(name => (
                      <div key={name} style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '12px', 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        {name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                    No events registered yet.
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ 
              padding: '1.5rem 2.5rem', 
              borderTop: '1px solid rgba(255,255,255,0.05)', 
              background: 'rgba(255,255,255,0.02)', 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
               <button className="btn btn-outline" onClick={() => setSelectedUser(null)}>Dismiss</button>
               <button className="btn btn-primary" style={{ minWidth: '140px' }} onClick={() => setSelectedUser(null)}>Done</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingRole && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', 
          alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setEditingRole(null)}>
          <div className="card fade-in" style={{ 
            maxWidth: 400, width: '90%', background: 'var(--surface)', 
            padding: '2rem', boxShadow: 'var(--shadow-lg)' 
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Update Permissions</h3>
              <button className="icon-btn" onClick={() => setEditingRole(null)} style={{ border: 'none' }}><X size={20} /></button>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Assign a new administrative or member role to this user. This change will take effect immediately.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label className="form-label">System Role</label>
              <select 
                className="form-input" 
                value={newRole} 
                onChange={e => setNewRole(e.target.value)}
                style={{ appearance: 'none' }}
              >
                <option value="student">Student (Member)</option>
                <option value="coordinator">Coordinator</option>
                <option value="captain">Captain</option>
                <option value="admin">Administrator</option>
                <option value="dev">Developer (Superuser)</option>
              </select>
            </div>

            {newRole === 'captain' && (
              <div style={{ marginBottom: '2rem' }}>
                <label className="form-label">House Team</label>
                <select 
                  className="form-input" 
                  value={newTeam} 
                  onChange={e => setNewTeam(e.target.value)}
                  style={{ appearance: 'none' }}
                >
                  <option value="Gryffindor">Gryffindor</option>
                  <option value="Ravenclaw">Ravenclaw</option>
                  <option value="Hufflepuff">Hufflepuff</option>
                  <option value="Slytherin">Slytherin</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingRole(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRoleUpdate}>Update Role</button>
            </div>
          </div>
        </div>,
        document.body
      )}
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

function roleColor(role) { 
  return { dev: '#8b5cf6', admin: '#f43f5e', coordinator: '#10b981', student: '#3b82f6' }[role] || 'var(--text-muted)'; 
}
function roleBg(role, alpha = 0.1) { 
  const hex = { dev: '#8b5cf6', admin: '#f43f5e', coordinator: '#10b981', student: '#3b82f6' }[role] || '#8c8c8c';
  // Simplified hex transparency
  return hex + Math.floor(alpha * 255).toString(16).padStart(2, '0');
}
