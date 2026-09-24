import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, FileClock, Gauge, LayoutDashboard, LogOut, Menu, ScrollText, Workflow, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../features/auth/AuthProvider';
import flowPilotLogo from '../assets/flowpilot-logo.png';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workflows', label: 'Workflows', icon: Workflow },
  { to: '/executions', label: 'Executions', icon: FileClock },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/audit', label: 'Audit Logs', icon: ScrollText },
  { to: '/system', label: 'System', icon: Gauge },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const nav = (
    <>
      <div className="sidebar-brand">
        <img className="brand-logo sidebar-logo" src={flowPilotLogo} alt="FlowPilot AI" />
        <div>
          <strong>FlowPilot AI</strong>
          <span>Operations</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setIsOpen(false)}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div>
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>
        </div>
        <button className="icon-button" type="button" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar desktop-only">{nav}</aside>
      <div className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
        <aside className="sidebar">
          <button className="icon-button drawer-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
          {nav}
        </aside>
      </div>
      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" type="button" onClick={() => setIsOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div>
            <span className="eyebrow">Organization console</span>
            <strong>{user?.email}</strong>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
