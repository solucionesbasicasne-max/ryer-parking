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
import { db, seedDatabase } from './db/db'
import { Sun, Moon } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [capacity, setCapacity] = useState({ total: 0, occupied: 0 })
  const [isCajaOpen, setIsCajaOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('ryer_theme') || 'dark')

  useEffect(() => {
    seedDatabase()
    const savedUser = localStorage.getItem('ryer_user')
    if (savedUser) setUser(JSON.parse(savedUser))

    const fetchData = async () => {
      // Capacity
      const total = (await db.config.get('capacity'))?.value || 50
      const occupied = await db.entries.where('status').equals('active').count()
      setCapacity({ total, occupied })
      
      // Caja Status
      const activeSession = await db.sessions.where('status').equals('open').first()
      setIsCajaOpen(!!activeSession)
    }
    
    fetchData()
    const interval = setInterval(fetchData, 5000)
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
      case 'checkin': return <CheckIn capacity={capacity} {...commonProps} />
      case 'checkout': return <CheckOut {...commonProps} />
      case 'clients': return <Clients {...commonProps} />
      case 'reports': return <Reports {...commonProps} />
      case 'caja': return <Caja {...commonProps} />
      case 'users': return <UserManagement {...commonProps} />
      case 'settings': return <Settings {...commonProps} />
      default: return <Dashboard {...commonProps} />
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
      />
      
      <main style={{ padding: '1rem', overflowY: 'auto', maxHeight: '100vh', width: '100%' }}>
        <header className="flex-between" style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ marginBottom: '0.25rem' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
            </h1>
            {!isCajaOpen && activeTab !== 'caja' && (
               <span style={{ background: 'var(--danger)20', color: 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                 CAJA CERRADA - ABRA UNA SESIÓN
               </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="btn" 
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.5rem' }}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{user.username.toUpperCase()}</p>
                <p style={{ fontSize: '0.7rem', color: user.role === 'Admin' ? 'var(--brand-primary)' : 'var(--success)' }}>{user.role}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'white' }}>
                <span style={{ margin: 'auto' }}>{user.username[0].toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  )
}

export default App
