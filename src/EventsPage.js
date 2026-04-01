import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Eye,
  Download,
  MoreVertical,
  ExternalLink,
  Phone
} from 'lucide-react';
import { eventsAPI, adminAPI } from './api';
import { AdminAuthContext } from './App';

export default function EventsPage() {
  const { user } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [regMap, setRegMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventsAPI.getAll(),
      adminAPI.getRegistrations()
    ]).then(([ev, regs]) => {
      setEvents(ev.data.events || []);
      // Build event → count map
      const map = {};
      (regs.data.registrations || []).forEach(r => {
        map[r.eventId] = (map[r.eventId] || 0) + 1;
      });
      setRegMap(map);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  // Sort events by registration count in descending order (highest first)
  const sortedEvents = [...events].sort((a, b) => {
    const countA = regMap[a.id] || 0;
    const countB = regMap[b.id] || 0;
    return countB - countA;
  });

  return (
    <div className="fade-in">
      <div className="card table-card">
        <div className="table-header">
          <div>
            <h3 className="table-title">Scheduled Events</h3>
          </div>
          <div className="table-actions">
            <button className="btn btn-outline"
              onClick={() => adminAPI.downloadRegistrations()}>
              <Download size={16} />
              Export All Entries
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: '5rem' }}>Loading events data...</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Event</th>
                  <th>Coordinator</th>
                  <th style={{ textAlign: 'center' }}>Registrations</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Map over sortedEvents instead of events */}
                {sortedEvents.map((ev, i) => (
                  <tr key={ev.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: '40px' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{ev.name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ev.coordinator?.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        <Phone size={10} />
                        {ev.coordinator?.contact}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-green" style={{ minWidth: 40, justifyContent: 'center', fontWeight: 700 }}>
                        {regMap[ev.id] || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button className="icon-btn" title="View Registrations"
                          onClick={() => navigate(`/registrations?event=${ev.id}`)}>
                          <Eye size={16} />
                        </button>
                        <button className="icon-btn" title="Download CSV"
                          onClick={() => adminAPI.downloadRegistrations(ev.id)}>
                          <Download size={16} />
                        </button>
                      </div>
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