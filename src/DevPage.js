import React, { useState, useContext, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Key, 
  FileUp, 
  Database, 
  Terminal,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Monitor,
  AlertTriangle,
  Lock,
  Loader2,
  Settings,
  CalendarDays,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Save,
  Rocket,
  LockOpen,
} from 'lucide-react';
import { adminAPI, eventsAPI } from './api';
import { AdminAuthContext } from './App';
import * as XLSX from 'xlsx';

export default function DevPage() {
  const { user } = useContext(AdminAuthContext);
  const [unlocked, setUnlocked] = useState(false);
  const [devPass, setDevPass] = useState('');
  const [passErr, setPassErr] = useState('');
  const [tab, setTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  
  // New: Import Preview & Manual Entry State
  const [pendingStudents, setPendingStudents] = useState([]);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ 
    studentName: '', rrn: '', emailId: '', team: 'Gryffindor', 
    dept: '', year: '', section: '', contactNumber: '' 
  });
  
  // New Auth User state
  const [newAuthEmail, setNewAuthEmail] = useState('');
  const [newAuthName, setNewAuthName] = useState('');
  const [newAuthRole, setNewAuthRole] = useState('coordinator');
  const [newAuthTeam, setNewAuthTeam] = useState('Gryffindor');
  const [addingUser, setAddingUser] = useState(false);
  // Event management state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ id: '', name: '', category: 'Cultural', description: '', venue: '', date: '', time: '', teamSize: '1', coordinatorName: '', coordinatorContact: '', coordinatorDept: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [evSaving, setEvSaving] = useState(false);
  const [evMsg, setEvMsg] = useState('');
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const verifyDev = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.verifyDev(devPass);
      setUnlocked(true);
    } catch {
      setPassErr('Incorrect dev password.');
    }
  };

  const handleAddUser = async () => {
    if (!newAuthEmail || !newAuthEmail.includes('@')) return;
    setAddingUser(true);
    await adminAPI.addUserByEmail(newAuthEmail, newAuthRole, newAuthName, newAuthRole === 'captain' ? newAuthTeam : '').catch(() => {});
    setAddingUser(false);
    setNewAuthEmail('');
    setNewAuthName('');
    setNewAuthRole('coordinator');
    adminAPI.getUsers().then(r => setUsers(r.data.users || []));
  };

  useEffect(() => {
    if (!unlocked) return;
    eventsAPI.getAll().then(r => setEvents(r.data.events || [])).catch(() => {});
    adminAPI.getUsers().then(r => setUsers(r.data.users || [])).catch(() => {});
  }, [unlocked]);

  const refreshEvents = () => eventsAPI.getAll().then(r => setEvents(r.data.events || [])).catch(() => {});

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setEditForm({ name: ev.name, category: ev.category, description: ev.description, venue: ev.venue, date: ev.date, time: ev.time, teamSize: ev.teamSize, coordinatorName: ev.coordinator?.name || '', coordinatorContact: ev.coordinator?.contact || '', coordinatorDept: ev.coordinator?.department || '' });
  };

  const saveEdit = async (id) => {
    setPublished(false);
    setEvSaving(true); setEvMsg('');
    try {
      await adminAPI.updateEvent(id, { ...editForm, coordinator: { name: editForm.coordinatorName, contact: editForm.coordinatorContact, department: editForm.coordinatorDept } });
      setEvMsg('✅ Saved! Click Proceed to publish to students.');
      setEditingId(null);
      refreshEvents();
    } catch(e) { setEvMsg('❌ ' + (e.response?.data?.error || 'Save failed')); }
    finally { setEvSaving(false); }
  };

  const deleteEvent = async (id) => {
    setPublished(false);
    setEvSaving(true);
    try { await adminAPI.deleteEvent(id); setDeleteConfirm(null); refreshEvents(); }
    catch(e) { setEvMsg('❌ Delete failed'); }
    finally { setEvSaving(false); }
  };

  const addEvent = async () => {
    setPublished(false);
    setEvSaving(true); setEvMsg('');
    try {
      await adminAPI.addEvent({ ...newForm, coordinator: { name: newForm.coordinatorName, contact: newForm.coordinatorContact, department: newForm.coordinatorDept } });
      setEvMsg('✅ Event added! Click Proceed to publish to students.');
      setAddingNew(false);
      setNewForm({ id: '', name: '', category: 'Cultural', description: '', venue: '', date: '', time: '', teamSize: '1', coordinatorName: '', coordinatorContact: '', coordinatorDept: '' });
      refreshEvents();
    } catch(e) { setEvMsg('❌ ' + (e.response?.data?.error || 'Add failed')); }
    finally { setEvSaving(false); }
  };

  const moveEvent = async (idx, dir) => {
    setPublished(false);
    const copy = [...events];
    const swap = idx + dir;
    if (swap < 0 || swap >= copy.length) return;
    [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
    setEvents(copy);
    await adminAPI.reorderEvents(copy.map(e => e.id)).catch(() => {});
  };

  if (!unlocked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }} className="fade-in">
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 20, 
            background: 'var(--surface-hover)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.5rem', border: '1px solid var(--border)' 
          }}>
            <Terminal size={40} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Developer Panel</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '2rem' }}>Authentication required to access system developer tools.</p>
          
          <form onSubmit={verifyDev}>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={16} />
              <input 
                className="form-input" 
                type="password" 
                placeholder="Developer Password"
                value={devPass} 
                onChange={e => setDevPass(e.target.value)} 
                style={{ paddingLeft: '2.75rem' }} 
              />
            </div>
            {passErr && (
              <div style={{ color: '#f43f5e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={14} />
                {passErr}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
              Unlock Tools
              <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const normalizeTeam = (t) => {
    if (!t) return '';
    const clean = String(t).trim().toLowerCase();
    const map = {
      'gryffindor': 'Gryffindor',
      'slytherin': 'Slytherin',
      'ravenclaw': 'Ravenclaw',
      'hufflepuff': 'Hufflepuff'
    };
    return map[clean] || (clean.charAt(0).toUpperCase() + clean.slice(1));
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true); setImportResult('');
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const students = rows.map(r => {
          const rrn = String(r['RRN'] || r['rrn'] || '').trim();
          return {
            studentName:   r['Student_Name'] || r['studentName'] || '',
            rrn:           rrn,
            emailId:       (r['email_id'] || r['emailId'] || (rrn ? `${rrn.toLowerCase()}@crescent.education` : '')).toLowerCase(),
            team:          normalizeTeam(r['Team'] || r['team'] || ''),
            dept:          r['dept'] || r['Dept'] || '',
            year:          r['Year'] || r['year'] || r['YEAR'] || r['class'] || r['Class'] || '',
            section:       r['section'] || r['Section'] || '',
            contactNumber: String(r['contact'] || r['Contact'] || r['contactNumber'] || '')
          };
        }).filter(s => s.rrn || s.studentName);

        setPendingStudents(prev => [...prev, ...students]);
        setImportResult(`📂 Loaded ${students.length} students. Review below.`);
      } catch (err) {
        setImportResult(`❌ Load failed: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const addManualStudent = () => {
    if (!manualForm.rrn || !manualForm.studentName) return;
    const student = {
      ...manualForm,
      team: normalizeTeam(manualForm.team),
      emailId: (manualForm.rrn ? `${manualForm.rrn.toLowerCase()}@crescent.education` : '')
    };
    setPendingStudents(prev => [...prev, student]);
    setManualForm({ studentName: '', rrn: '', emailId: '', team: 'Gryffindor', dept: '', year: '', section: '', contactNumber: '' });
  };

  const commitStudents = async () => {
    if (pendingStudents.length === 0) return;
    setImporting(true); setImportResult('');
    try {
      const res = await adminAPI.uploadStudents(pendingStudents);
      setImportResult(`✅ Successfully imported ${res.data.processed} students.`);
      setPendingStudents([]);
    } catch (err) {
      setImportResult(`❌ Import failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header Info */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>System Infrastructure</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Advanced developer dashboard for system maintenance and mass operations.</p>
      </div>

      {/* Tab Bar */}
      <div className="card" style={{ padding: '0.5rem', display: 'inline-flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[
          { id: 'overview', icon: BarChart3, label: 'Analytics' },
          { id: 'events', icon: CalendarDays, label: 'Events' },
          { id: 'import', icon: Database, label: 'Data Import' },
          { id: 'roles', icon: ShieldCheck, label: 'Permissions' }
        ].map(t => (
          <button 
            key={t.id} 
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setTab(t.id)}
            style={{ padding: '0.6rem 1.25rem', gap: '0.6rem', border: 'none' }}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Monitor size={24} /></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Configured</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{events.length}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>System Events</div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Users size={24} /></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Active</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{users.length}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Database Users</div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><ShieldCheck size={24} /></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Assigned</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{users.filter(u => u.role === 'coordinator').length}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Event Coordinators</div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 12, background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}><Key size={24} /></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Privileged</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{users.filter(u => u.role === 'admin').length}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Platform Administrators</div>
            </div>
          </div>

          <div className="card table-card">
            <div className="table-header">
              <div>
                <h3 className="table-title">Events Configuration</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Static configuration from server-side manifests.</p>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID Tag</th>
                    <th>Display Name</th>
                    <th>Category</th>
                    <th>Coordinator Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => (
                    <tr key={ev.id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{i + 1}</td>
                      <td>
                        <code style={{ 
                          background: 'var(--surface-hover)', padding: '0.2rem 0.5rem', 
                          borderRadius: 6, fontSize: '0.75rem', color: 'var(--primary)',
                          fontFamily: 'monospace' 
                        }}>
                          {ev.id}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>{ev.name}</td>
                      <td><span className="badge badge-blue">{ev.category}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{ev.coordinator?.name || '—'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{ev.coordinator?.contact}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1.25rem', background: 'var(--surface-hover)', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--primary)' }} />
              <span>To modify runtime configuration, update <b>backend/config/events.config.js</b> on the host system.</span>
            </div>
          </div>
        </div>
      )}

      {/* Events Management Tab */}
      {tab === 'events' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Event Configuration</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Add, edit, reorder, or remove events. Click Proceed when done to update students in real-time.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {published ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Check size={15} /> Live for Students
                </div>
              ) : (
                <button
                  className="btn"
                  style={{ gap: '0.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981', fontWeight: 600 }}
                  onClick={async () => {
                    setPublishing(true);
                    try {
                      await adminAPI.publishEvents();
                      setPublished(true);
                      setEvMsg('');
                    } catch(e) { setEvMsg('❌ Could not confirm publish.'); }
                    finally { setPublishing(false); }
                  }}
                  disabled={publishing}
                >
                  {publishing ? <Loader2 className="animate-spin" size={15} /> : <Rocket size={15} />}
                  {publishing ? 'Publishing…' : 'Proceed — Publish to Students'}
                </button>
              )}
              <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={() => { setAddingNew(true); setEvMsg(''); setPublished(false); }}>
                <Plus size={16} /> Add Event
              </button>
            </div>
          </div>

          {evMsg && (
            <div className="fade-in" style={{ marginBottom: '1rem', padding: '0.75rem 1.25rem', borderRadius: 10, fontSize: '0.85rem', background: evMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: evMsg.startsWith('✅') ? '#10b981' : '#f43f5e', border: `1px solid ${evMsg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
              {evMsg}
            </div>
          )}

          {addingNew && (
            <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h4 style={{ fontWeight: 700 }}>New Event</h4>
                <button className="btn btn-ghost" style={{ padding: '0.35rem' }} onClick={() => setAddingNew(false)}><X size={16} /></button>
              </div>
              <EventForm form={newForm} onChange={setNewForm} />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setAddingNew(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={addEvent} disabled={evSaving || !newForm.id || !newForm.name}>
                  {evSaving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Add Event
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.map((ev, idx) => (
              <div key={ev.id} className="card" style={{ padding: 0, overflow: 'hidden', border: editingId === ev.id ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ padding: '0.15rem 0.35rem' }} onClick={() => moveEvent(idx, -1)} disabled={idx === 0}><ChevronUp size={12} /></button>
                    <button className="btn btn-ghost" style={{ padding: '0.15rem 0.35rem' }} onClick={() => moveEvent(idx, 1)} disabled={idx === events.length - 1}><ChevronDown size={12} /></button>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', width: 20, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {ev.name}
                      {ev.registrationOpen === false && (
                        <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem', borderRadius: 4, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontWeight: 600 }}>CLOSED</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span className="badge badge-blue" style={{ marginRight: '0.5rem', fontSize: '0.65rem' }}>{ev.category}</span>
                      {ev.coordinator?.name && <span>{ev.coordinator.name} · {ev.coordinator.contact}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {editingId === ev.id ? (
                      <>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', gap: '0.4rem', fontSize: '0.8rem' }} onClick={() => saveEdit(ev.id)} disabled={evSaving}>
                          {evSaving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />} Save
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.5rem' }} onClick={() => setEditingId(null)}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '0.35rem 0.65rem', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 600,
                            color: ev.registrationOpen === false ? '#10b981' : '#f59e0b',
                            border: ev.registrationOpen === false ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
                            background: ev.registrationOpen === false ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                          }}
                          title={ev.registrationOpen === false ? 'Open Registration' : 'Close Registration'}
                          onClick={async () => { await adminAPI.toggleRegistration(ev.id).catch(()=>{}); refreshEvents(); setPublished(false); }}
                        >
                          {ev.registrationOpen === false ? <LockOpen size={13} /> : <Lock size={13} />}
                          {ev.registrationOpen === false ? 'Open Reg.' : 'Close Reg.'}
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.5rem' }} title="Edit" onClick={() => startEdit(ev)}><Edit3 size={14} /></button>
                        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.5rem', color: '#f43f5e' }} title="Delete" onClick={() => setDeleteConfirm(ev.id)}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>

                {deleteConfirm === ev.id && (
                  <div className="fade-in" style={{ padding: '0.75rem 1.25rem', background: 'rgba(244,63,94,0.08)', borderTop: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#f43f5e' }}>Delete <b>{ev.name}</b>? This cannot be undone.</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      <button className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }} onClick={() => deleteEvent(ev.id)} disabled={evSaving}>
                        {evSaving ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />} Delete
                      </button>
                    </div>
                  </div>
                )}

                {editingId === ev.id && (
                  <div className="fade-in" style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                    <EventForm form={editForm} onChange={setEditForm} hideId />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--surface-hover)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            Changes are saved to <b style={{ marginLeft: '0.25rem', marginRight: '0.25rem' }}>events.config.js</b>. Restart the backend server for students to see updates.
          </div>
        </div>
      )}

      {/* Import Tab */}
      {tab === 'import' && (
        <div className="fade-in" style={{ maxWidth: pendingStudents.length > 0 ? '100%' : 700 }}>
          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: 12, background: 'var(--surface-hover)' }}><Database size={24} /></div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Student Directory Import</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Sync master database via Excel or manual entry.</p>
                </div>
              </div>
              <button 
                className={`btn ${showManual ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setShowManual(!showManual)}
                style={{ gap: '0.5rem' }}
              >
                <Plus size={16} /> {showManual ? 'Hide Manual Form' : 'Manual Entry'}
              </button>
            </div>

            {/* Manual Entry Form */}
            {showManual && (
              <div className="fade-in" style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Add Single Student</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  <input className="form-input" placeholder="Name" value={manualForm.studentName} onChange={e => setManualForm({...manualForm, studentName: e.target.value})} />
                  <input className="form-input" placeholder="RRN" value={manualForm.rrn} onChange={e => setManualForm({...manualForm, rrn: e.target.value})} />
                  <input className="form-input" placeholder="Email (Optional)" value={manualForm.emailId} onChange={e => setManualForm({...manualForm, emailId: e.target.value})} />
                  <div style={{ position: 'relative' }}>
                    <select className="form-input" style={{ width: '100%', appearance: 'none' }} value={manualForm.team} onChange={e => setManualForm({...manualForm, team: e.target.value})}>
                      <option value="Gryffindor">Gryffindor</option>
                      <option value="Ravenclaw">Ravenclaw</option>
                      <option value="Hufflepuff">Hufflepuff</option>
                      <option value="Slytherin">Slytherin</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
                  </div>
                  <input className="form-input" placeholder="Dept" value={manualForm.dept} onChange={e => setManualForm({...manualForm, dept: e.target.value})} />
                  <input className="form-input" placeholder="Year" value={manualForm.year} onChange={e => setManualForm({...manualForm, year: e.target.value})} />
                  <input className="form-input" placeholder="Section" value={manualForm.section} onChange={e => setManualForm({...manualForm, section: e.target.value})} />
                  <input className="form-input" placeholder="Contact" value={manualForm.contactNumber} onChange={e => setManualForm({...manualForm, contactNumber: e.target.value})} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={addManualStudent} disabled={!manualForm.rrn || !manualForm.studentName}>
                    <Plus size={16} /> Add to Preview List
                  </button>
                </div>
              </div>
            )}

            <div style={{ 
              border: '2px dashed var(--border)', borderRadius: 16, padding: '2rem', 
              textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)',
              transition: 'var(--transition)', marginBottom: '1.5rem',
              position: 'relative'
            }}>
              {importing ? (
                <div style={{ padding: '1rem' }}>
                  <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                  <p style={{ fontWeight: 600 }}>Processing Import...</p>
                </div>
              ) : (
                <>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <FileUp size={20} style={{ color: 'var(--text-dim)' }} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Click or drag Excel file to upload</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>Supporting .xlsx, .xls</p>
                  <input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleImportExcel}
                    style={{ 
                      opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' 
                    }} 
                  />
                  <div className="btn btn-ghost" style={{ display: 'inline-flex', fontSize: '0.85rem' }}>Select File</div>
                </>
              )}
            </div>

            {importResult && (
              <div className="fade-in" style={{ 
                padding: '0.75rem 1rem', borderRadius: 12, fontSize: '0.85rem',
                background: importResult.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                color: importResult.startsWith('✅') ? '#10b981' : '#3b82f6',
                border: importResult.startsWith('✅') ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem'
              }}>
                {importResult.startsWith('✅') ? <Check size={16} /> : <FileUp size={16} />}
                {importResult}
              </div>
            )}

            {/* Preview Table */}
            {pendingStudents.length > 0 && (
              <div className="fade-in card table-card" style={{ marginTop: '1rem', border: '1px solid var(--border)' }}>
                <div className="table-header" style={{ justifyContent: 'space-between' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Import Preview ({pendingStudents.length} Students)</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost" onClick={() => setPendingStudents([])} style={{ color: '#f43f5e' }}>Clear List</button>
                    <button className="btn btn-primary" onClick={commitStudents} disabled={importing}>
                      {importing ? <Loader2 className="animate-spin" size={16} /> : <Rocket size={16} />}
                      Proceed — Sync to Database
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>S.no</th>
                        <th>Student_Name</th>
                        <th>RRN</th>
                        <th>Email</th>
                        <th>Team</th>
                        <th>Year</th>
                        <th>Dept</th>
                        <th>Sec</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingStudents.map((s, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                          <td><code>{s.rrn}</code></td>
                          <td style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{s.emailId}</td>
                          <td>{s.team}</td>
                          <td>{s.year}</td>
                          <td>{s.dept}</td>
                          <td>{s.section}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-ghost" 
                              style={{ padding: '0.25rem', color: '#f43f5e' }}
                              onClick={() => setPendingStudents(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface-hover)', borderRadius: 12 }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={14} /> Expected Columns (Excel)
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['Student_Name', 'RRN', 'email_id', 'Team', 'Dept', 'Class', 'Section', 'Contact'].map(col => (
                  <span key={col} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4 }}>{col}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div className="fade-in card table-card">
          <div className="table-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem' }}>
            <div>
              <h3 className="table-title">Permission Management</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Control administrative access for platform personnel.</p>
            </div>
            
            {/* Add User Form */}
            <div style={{ background: 'var(--surface-hover)', padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="Email Address..." 
                    value={newAuthEmail}
                    onChange={e => setNewAuthEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  {newAuthEmail.toLowerCase().includes('@crescent.education') && (
                    <div style={{ position: 'absolute', top: '100%', left: '0.5rem', marginTop: '0.25rem', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={10} /> RRN Detected: {newAuthEmail.split('@')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Full Name..." 
                    value={newAuthName}
                    onChange={e => setNewAuthName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <select 
                    className="form-input" 
                    value={newAuthRole}
                    onChange={e => setNewAuthRole(e.target.value)}
                    style={{ paddingRight: '2rem', appearance: 'none', background: 'var(--surface)', minWidth: 140 }}
                  >
                    <option value="coordinator">Coordinator</option>
                    <option value="captain">Captain</option>
                    <option value="admin">Administrator</option>
                    <option value="dev">Developer</option>
                  </select>
                  <ChevronRight size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', color: 'var(--text-dim)' }} />
                </div>
                {newAuthRole === 'captain' && (
                  <div style={{ position: 'relative' }}>
                    <select 
                      className="form-input" 
                      value={newAuthTeam}
                      onChange={e => setNewAuthTeam(e.target.value)}
                      style={{ paddingRight: '2rem', appearance: 'none', background: 'var(--surface)', minWidth: 140 }}
                    >
                      <option value="Gryffindor">Gryffindor</option>
                      <option value="Ravenclaw">Ravenclaw</option>
                      <option value="Hufflepuff">Hufflepuff</option>
                      <option value="Slytherin">Slytherin</option>
                    </select>
                    <ChevronRight size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', color: 'var(--text-dim)' }} />
                  </div>
                )}
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddUser}
                  disabled={addingUser || !newAuthEmail.includes('@')}
                  style={{ height: '38px', padding: '0 1.25rem' }}
                >
                  {addingUser ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  Add User
                </button>
              </div>
            </div>
          </div>
          <div className="perm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Administrator</th>
                  <th style={{ width: '20%' }}>System Identity</th>
                  <th style={{ width: '15%' }}>Status/Role</th>
                  <th style={{ textAlign: 'right', width: '40%' }}>Authorization Control</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role !== 'student').map(u => (
                  <RoleRow key={u._id} userData={u} events={events} onSaved={() => adminAPI.getUsers().then(r => setUsers(r.data.users || []))} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleRow({ userData: u, events, onSaved }) {
  const [role, setRole] = useState(u.role);
  const [assignedEvents, setAssignedEvents] = useState(u.assignedEvents || []);
  const [team, setTeam] = useState(u.team || 'Gryffindor');
  const [saving, setSaving] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const DEV_EMAILS = ['zzayir21@gmail.com', '230171601108@crescent.education'];
  const isDevLocked = DEV_EMAILS.includes((u.email || '').toLowerCase());

  const save = async () => {
    setSaving(true);
    await adminAPI.updateRole(u._id, role, role === 'captain' ? team : '', role === 'coordinator' ? assignedEvents : []).catch(() => {});
    setSaving(false);
    onSaved();
  };

  const toggleEvent = (evId) => {
    setAssignedEvents(prev => prev.includes(evId) ? prev.filter(id => id !== evId) : [...prev, evId]);
  };

  return (
    <tr>
      <td style={{ verticalAlign: 'top', paddingTop: '1.25rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>{u.email}</div>
      </td>
      <td>
        <code style={{ fontSize: '0.75rem', opacity: 0.6 }}>{u._id}</code>
      </td>
      <td>
        <span className="badge" style={{ 
          background: roleBg(u.role, 0.1), 
          color: roleColor(u.role),
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          letterSpacing: '0.05em'
        }}>
          {u.role}
        </span>
      </td>
      <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <select 
                  className="form-input" 
                  value={isDevLocked ? 'dev' : role} 
                  onChange={e => setRole(e.target.value)}
                  disabled={isDevLocked}
                  style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem', appearance: 'none', background: 'var(--surface)', minWidth: 140, opacity: isDevLocked ? 0.6 : 1, cursor: isDevLocked ? 'not-allowed' : 'pointer' }}
                >
                  <option value="coordinator">Coordinator</option>
                  <option value="captain">Captain</option>
                  <option value="admin">Administrator</option>
                  <option value="dev">Developer</option>
                </select>
                {isDevLocked ? (
                  <Lock size={12} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
                ) : (
                  <ChevronRight size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', opacity: 0.5 }} />
                )}
              </div>
              {role === 'captain' && !isDevLocked && (
                <div style={{ position: 'relative' }}>
                  <select 
                    className="form-input" 
                    value={team} 
                    onChange={e => setTeam(e.target.value)}
                    style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem', appearance: 'none', background: 'var(--surface)', minWidth: 120 }}
                  >
                    <option value="Gryffindor">Gryffindor</option>
                    <option value="Ravenclaw">Ravenclaw</option>
                    <option value="Hufflepuff">Hufflepuff</option>
                    <option value="Slytherin">Slytherin</option>
                  </select>
                  <ChevronRight size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', opacity: 0.5 }} />
                </div>
              )}
              {role === 'coordinator' && !isDevLocked && (
                <button 
                  className={`btn ${showEvents ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.4rem' }}
                  onClick={() => setShowEvents(!showEvents)}
                >
                  <CalendarDays size={14} />
                  Events ({assignedEvents.length})
                </button>
              )}
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1rem', minWidth: '100px', display: 'flex', justifyContent: 'center' }}
              onClick={save} 
              disabled={saving || (role === u.role && team === u.team && JSON.stringify(assignedEvents) === JSON.stringify(u.assignedEvents)) || isDevLocked}
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : 'Process'}
            </button>

            {!isDevLocked && (
              <button
                className="btn btn-ghost"
                style={{ padding: '0.5rem 0.5rem', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                onClick={async () => {
                  if (window.confirm(`Revoke all administrative access for ${u.name}?`)) {
                    setSaving(true);
                    await adminAPI.updateRole(u._id, 'student').catch(() => {});
                    setSaving(false);
                    onSaved();
                  }
                }}
                disabled={saving}
                title="Revoke Access"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          
          {role === 'coordinator' && showEvents && !isDevLocked && (
            <div className="fade-in" style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 12, border: '1px solid var(--primary)', width: '100%', maxWidth: '350px', textAlign: 'left', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assign Events</div>
                <button className="btn btn-ghost" style={{ padding: '0.2rem', height: 'auto' }} onClick={() => setShowEvents(false)}><X size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {events.map(ev => (
                  <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', padding: '0.35rem 0.5rem', cursor: 'pointer', borderRadius: 6, background: assignedEvents.includes(ev.id) ? 'rgba(16, 185, 129, 0.08)' : 'transparent', transition: 'var(--transition)' }}>
                    <input type="checkbox" checked={assignedEvents.includes(ev.id)} onChange={() => toggleEvent(ev.id)} style={{ accentColor: 'var(--primary)', width: 14, height: 14 }} />
                    <span style={{ color: assignedEvents.includes(ev.id) ? 'var(--text)' : 'var(--text-dim)' }}>{ev.name}</span>
                  </label>
                ))}
              </div>
              {events.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>No events configured.</div>}
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setShowEvents(false)}>Done</button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function roleColor(role) { 
  return { dev: '#8b5cf6', admin: '#f43f5e', coordinator: '#10b981', student: '#3b82f6' }[role] || 'var(--text-dim)'; 
}
function roleBg(role, alpha = 0.1) { 
  const hex = { dev: '#8b5cf6', admin: '#f43f5e', coordinator: '#10b981', student: '#3b82f6' }[role] || '#8c8c8c';
  return hex + Math.floor(alpha * 255).toString(16).padStart(2, '0');
}

function EventForm({ form, onChange, hideId }) {
  const field = (key, label, opts = {}) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <input
        className="form-input"
        style={{ fontSize: '0.9rem' }}
        value={form[key] || ''}
        onChange={e => onChange({ ...form, [key]: e.target.value })}
        {...opts}
      />
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {!hideId && field('id', 'Event ID (unique slug)', { placeholder: 'e.g. dance' })}
      {field('name', 'Display Name', { placeholder: 'e.g. Dance (Group/Solo)' })}
      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
        <select className="form-input" style={{ fontSize: '0.9rem' }} value={form.category || 'Cultural'} onChange={e => onChange({ ...form, category: e.target.value })}>
          <option>Cultural</option>
          <option>Sports</option>
          <option>Media</option>
          <option>Technical</option>
          <option>Literary</option>
        </select>
      </div>
      {field('description', 'Description', { placeholder: 'Brief description' })}
      {field('venue', 'Venue', { placeholder: 'e.g. Main Stage' })}
      {field('date', 'Date', { type: 'date' })}
      {field('time', 'Time', { placeholder: 'e.g. 09:00 AM' })}
      {field('teamSize', 'Team Size', { placeholder: 'e.g. 1 or 1-10' })}
      {field('coordinatorName', 'Coordinator Name', { placeholder: 'Name / Name' })}
      {field('coordinatorContact', 'Coordinator Contact', { placeholder: 'Phone / Phone' })}
      {field('coordinatorDept', 'Coordinator Dept', { placeholder: 'Dept / Dept' })}
    </div>
  );
}
