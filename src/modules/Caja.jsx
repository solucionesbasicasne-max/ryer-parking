import React, { useState, useEffect } from 'react'
import { getSesionActiva, abrirSesion, cerrarSesion, getTotalVentasSesion } from '../services/cajaService'
import { Wallet, LogIn, LogOut, TrendingUp, Loader } from 'lucide-react'

const Caja = ({ setIsCajaOpen }) => {
  const [activeSession, setActiveSession]     = useState(null)
  const [openingBalance, setOpeningBalance]   = useState('')
  const [closingBalance, setClosingBalance]   = useState('')
  const [summary, setSummary]                 = useState({ totalSales: 0 })
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)

  const fetchSession = async () => {
    try {
      const session = await getSesionActiva()
      if (session) {
        const totalSales = await getTotalVentasSesion(session.openTime)
        setActiveSession(session)
        setSummary({ totalSales })
        setIsCajaOpen(true)
      } else {
        setActiveSession(null)
        setIsCajaOpen(false)
      }
    } catch (err) {
      console.error('[Caja] Error cargando sesión:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  const handleOpen = async () => {
    if (!openingBalance) return alert('Ingrese el saldo inicial')
    setSaving(true)
    try {
      await abrirSesion(openingBalance)
      setOpeningBalance('')
      alert('¡Caja abierta con éxito!')
      fetchSession()
    } catch (err) {
      alert('Error al abrir caja: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async () => {
    if (!closingBalance) return alert('Ingrese el saldo final contado')
    const expected = activeSession.initialBalance + summary.totalSales
    setSaving(true)
    try {
      const closed = await cerrarSesion(activeSession.id, closingBalance, expected)
      alert(`Caja cerrada. Diferencia: $${closed.difference.toFixed(2)}`)
      setActiveSession(null)
      setIsCajaOpen(false)
      setClosingBalance('')
    } catch (err) {
      alert('Error al cerrar caja: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <Loader size={32} style={{ margin: '0 auto', display: 'block', color: 'var(--brand-primary)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando estado de caja...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {!activeSession ? (
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <div style={{
            width: '80px', height: '80px', background: 'var(--brand-primary)20',
            borderRadius: '50%', color: 'var(--brand-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
          }}>
            <Wallet size={40} />
          </div>
          <h2>Caja Cerrada</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Debe abrir una sesión para operar el sistema hoy.
          </p>

          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="input-label">Saldo Inicial (Efectivo)</label>
            <input
              type="number"
              placeholder="0.00"
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleOpen} disabled={saving}>
            {saving ? <Loader size={20} /> : <LogIn size={20} />} Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <div>
              <h3>Caja en Operación</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Abierta el: {new Date(activeSession.openTime).toLocaleString()}
              </p>
            </div>
            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>● ACTIVA</span>
          </div>

          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            <div className="card" style={{ background: 'var(--bg-accent)10', padding: '1rem' }}>
              <p className="input-label">Saldo Inicial</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${activeSession.initialBalance.toFixed(2)}</p>
            </div>
            <div className="card" style={{ background: 'var(--brand-primary)10', padding: '1rem' }}>
              <p className="input-label">Ventas Registradas</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
                + ${summary.totalSales.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)', border: '1px dashed var(--brand-primary)', marginBottom: '2rem' }}>
            <div className="flex-between">
              <div>
                <p className="input-label">Esperado en Caja</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                  ${(activeSession.initialBalance + summary.totalSales).toFixed(2)}
                </p>
              </div>
              <TrendingUp size={32} color="var(--brand-primary)" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Conteo Final de Efectivo</label>
            <input
              type="number"
              placeholder="Ingrese el monto físico contado..."
              value={closingBalance}
              onChange={e => setClosingBalance(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', background: 'var(--danger)', marginTop: '1rem' }}
            onClick={handleClose}
            disabled={saving}
          >
            {saving ? <Loader size={20} /> : <LogOut size={20} />} Cerrar Caja y Generar Corte
          </button>
        </div>
      )}
    </div>
  )
}

export default Caja
