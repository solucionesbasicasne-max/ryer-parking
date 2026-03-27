import React, { useEffect } from 'react';
import { LayoutDashboard, LogIn, LogOut, Users, FileText, Wallet, Settings, LogOut as LogoutIcon, UserCircle, X, Menu } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout, capacity, isOpen, onToggle }) => {
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

  const handleSelect = (id) => {
    setActiveTab(id);
    // En móvil, cerrar el drawer al seleccionar
    if (onToggle && window.innerWidth <= 768) {
      onToggle(false);
    }
  };

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onToggle(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onToggle]);

  const occupancyPct = capacity.total > 0 ? (capacity.occupied / capacity.total) * 100 : 0;

  return (
    <>
      {/* ── Overlay para cerrar al tocar fuera (solo móvil) ── */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => onToggle(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer / Sidebar ── */}
      <div className={`sidebar card ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Botón de cierre dentro del drawer (móvil) */}
        <button
          className="sidebar-close-btn btn"
          onClick={() => onToggle(false)}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>

        <div className="logo" style={{ marginBottom: '2rem', padding: '0.5rem' }}>
          <h2 style={{ color: 'var(--brand-primary)', margin: 0 }}>Ryer</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PARKING SYSTEM</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
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
                width: `${occupancyPct}%`,
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
    </>
  );
};

export default Sidebar;
