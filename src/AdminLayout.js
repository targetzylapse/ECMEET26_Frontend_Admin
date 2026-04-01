import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Calendar, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AdminAuthContext } from './App';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, captainHide: true, coordHide: true },
      { path: '/events', label: 'Events List', icon: Calendar, coordHide: true },
    ]
  },
  {
    title: 'Management',
    items: [
      { path: '/registrations', label: 'Registrations', icon: ClipboardList },
      { path: '/users', label: 'Students Details', icon: Users, coordHide: true },
      { path: '/staff', label: 'Users', icon: ShieldCheck },
    ]
  },
  {
    title: 'System',
    items: [
      { path: '/dev', label: 'Developer Lab', icon: Zap, devOnly: true },
    ]
  }
];

export default function AdminLayout({ children }) {
  const { user, logout } = useContext(AdminAuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const houseLogo = user?.role === 'captain' && user?.team
    ? `/assets/house-logos/${user.team.toLowerCase()}.svg`
    : null;

  return (
    <div className="admin-layout">
      {/* Mobile Menu Button - shows when topbar is removed */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <Menu size={24} />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        
        {/* Collapse Toggle inside Sidebar */}
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="sidebar-header" style={{ padding: collapsed ? '2rem 0' : '2rem 1.5rem', justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div className="sidebar-logo">
            <div className="logo-icon" style={(houseLogo || user?.role !== 'captain') ? { background: 'none', filter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
              {houseLogo ? (
                <img src={houseLogo} alt={user.team} style={{ width: 32, height: 32, objectFit: 'contain' }} />
              ) : user?.role !== 'captain' ? (
                <img src="/assets/images/ecmeet_logo.jpeg" alt="ECMEET" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-bright)' }} />
              ) : (
                <ShieldCheck size={20} />
              )}
            </div>
            {!collapsed && <span className="logo-text">ECMEET<span style={{ color: 'var(--primary)' }}>'26</span></span>}
          </div>
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" style={{ padding: collapsed ? '0 0.5rem' : '0 1rem' }}>
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="nav-group">
              {!collapsed && <h4 className="nav-group-title">{group.title}</h4>}
              {collapsed && <div style={{ height: '1rem' }}></div>}
              {group.items.filter(item => 
                (!item.devOnly || user?.role === 'dev') && 
                !(item.captainHide && user?.role === 'captain') &&
                !(item.coordHide && user?.role === 'coordinator')
              ).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0.85rem 0' : '0.85rem 1rem' }}
                >
                  <item.icon className="nav-icon" size={20} />
                  {!collapsed && <span>{item.label}</span>}
                  {(!collapsed && location.pathname === item.path) && <ChevronRight className="active-indicator" size={14} />}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ padding: collapsed ? '1.5rem 0' : '1.5rem' }}>
          
          
          {['admin', 'dev', 'coordinator'].includes(user?.role) && !collapsed && (
            <div className="sidebar-houses-row">
              {['gryffindor', 'hufflepuff', 'ravenclaw', 'slytherin'].map(h => (
                <div key={h} className="sidebar-house-icon-wrapper">
                  <img src={`/assets/house-logos/${h}.svg`} alt={h} />
                  <span className="house-tooltip-bubble">{h.charAt(0).toUpperCase() + h.slice(1)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-user" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0.5rem 0' : '0.5rem' }}>
            <div className="sidebar-user-avatar" style={{ overflow: 'hidden' }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.[0] || 'AS'
              )}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name}</div>
                <div className="sidebar-user-role">{user?.role}</div>
              </div>
            )}
            {!collapsed && (
              <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={logout} title="Sign Out">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
