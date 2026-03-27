import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './modules/Dashboard'
import CheckIn from './modules/CheckIn'
import CheckOut from './modules/CheckOut'
import Clients from './modules/Clients'
import Reports from './modules/Reports'
import Caja from './modules/Caja'
import Login from './modules/Login'
import UserManagement from './modules/UserManagement'
import Settings from './modules/Settings'
import { seedSupabase } from './lib/initDb'
import { getCapacidad } from './services/configService'
import { countActiveEntries } from './services/entradasService'
import { getSesionActiva } from './services/cajaService'
import { Sun, Moon, Menu } from 'lucide-react'

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  checkin:   'Entrada',
  checkout:  'Salida',
  clients:   'Clientes',
  reports:   'Reportes',
  caja:      'Caja',
  users:     'Usuarios',
  settings:  'Ajustes',
}

function App() {
  const [activeTab, setActiveTab]   = useState('dashboard')
  const [user, setUser]             = useState(null)
  const [capacity, setCapacity]     = useState({ total: 0, occupied: 0 })
  const [isCajaOpen, setIsCajaOpen] = useState(false)
  const [theme, setTheme]           = useState(localStorage.getItem('ryer_theme') || 'dark')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Inicializar y seed Supabase
    seedSupabase()

    const savedUser = localStorage.getItem('ryer_user')
    if (savedUser) setUser(JSON.parse(savedUser))

    const fetchData = async () => {
      try {
        const [total, occupied, activeSession] = await Promise.all([
          getCapacidad(),
          countActiveEntries(),
          getSesionActiva(),
        ])
        setCapacity({ total, occupied })
        setIsCajaOpen(!!activeSession)
      } catch (err) {
        console.error('[App] Error cargando datos:', err.message)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : ''
    localStorage.setItem('ryer_theme', theme)
  }, [theme])

  const handleLogin = (loggedUser) => {
    setUser(loggedUser)
    localStorage.setItem('ryer_user', JSON.stringify(loggedUser))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('ryer_user')
  }

  if (!user) return <Login onLogin={handleLogin} />

  const renderContent = () => {
    const commonProps = { isCajaOpen, user, setIsCajaOpen }
    switch (activeTab) {
      case 'dashboard': return <Dashboard capacity={capacity} {...commonProps} />
      case 'checkin':   return <CheckIn   capacity={capacity} {...commonProps} />
      case 'checkout':  return <CheckOut  {...commonProps} />
      case 'clients':   return <Clients   {...commonProps} />
      case 'reports':   return <Reports   {...commonProps} />
      case 'caja':      return <Caja      {...commonProps} />
      case 'users':     return <UserManagement {...commonProps} />
      case 'settings':  return <Settings  {...commonProps} />
      default:          return <Dashboard {...commonProps} />
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        capacity={capacity}
        theme={theme}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      <main style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '100vh', width: '100%' }}>
        {/* ── Top bar ── */}
        <header className="app-header flex-between">
          <button
            id="mobile-menu-btn"
            className="btn mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">
              {!isCajaOpen && activeTab !== 'caja' && (
                <span className="caja-badge">CAJA CERRADA</span>
              )}
              {MODULE_LABELS[activeTab] || activeTab}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.5rem' }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="card user-chip">
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{user.username.toUpperCase()}</p>
                <p style={{ fontSize: '0.7rem', color: user.role === 'Admin' ? 'var(--brand-primary)' : 'var(--success)' }}>
                  {user.role}
                </p>
              </div>
              <div className="avatar">
                <span>{user.username[0].toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Contenido del módulo ── */}
        <div style={{ padding: '1rem', flex: 1 }}>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App
