import React from 'react';
import { LayoutDashboard, LogIn, LogOut, Users, FileText, Wallet, Settings, LogOut as LogoutIcon, UserCircle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout, capacity }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'checkin', label: 'Entrada', icon: LogIn },
    { id: 'checkout', label: 'Salida', icon: LogOut },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'reports', label: 'Reportes', icon: FileText, adminOnly: true },
    { id: 'caja', label: 'Caja', icon: Wallet },
    { id: 'users', label: 'Usuarios', icon: UserCircle, adminOnly: true },
    { id: 'settings', label: 'Ajustes', icon: Settings, adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || user.role === 'Admin');

  return (
    <div className="sidebar card" style={{ height: 'calc(100vh - 2rem)', margin: '1rem', position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column' }}>
      <div className="logo" style={{ marginBottom: '2rem', padding: '0.5rem' }}>
        <h2 style={{ color: 'var(--brand-primary)', margin: 0 }}>Ryer</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PARKING SYSTEM</span>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`btn ${activeTab === item.id ? 'btn-primary' : ''}`}
            style={{ 
              justifyContent: 'flex-start', 
              width: '100%',
              backgroundColor: activeTab === item.id ? '' : 'transparent',
              color: activeTab === item.id ? '' : 'var(--text-secondary)'
            }}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '0 0.5rem', marginBottom: '1rem' }}>
          <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span>Ocupación</span>
            <span>{capacity.occupied} / {capacity.total}</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-accent)', borderRadius: '3px' }}>
            <div style={{ 
              width: `${(capacity.occupied / capacity.total) * 100}%`, 
              height: '100%', 
              background: capacity.occupied >= capacity.total ? 'var(--danger)' : 'var(--brand-primary)',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        <button 
          className="btn" 
          onClick={onLogout}
          style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', background: 'transparent' }}
        >
          <LogoutIcon size={20} />
          <span className="nav-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
