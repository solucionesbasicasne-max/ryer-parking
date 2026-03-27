import React, { useState, useEffect } from 'react'
import { getActiveEntries, getTodayEntries, getAlertEntries, subscribeEntries } from '../services/entradasService'
import { Car, DollarSign, Clock, AlertTriangle, CheckCircle, Timer, Loader } from 'lucide-react'

const Dashboard = ({ capacity, isCajaOpen }) => {
  const [stats, setStats]   = useState({ dailyIncome: 0, latest: [], alerts: [] })
  const [loading, setLoading] = useState(true)
  const [tick, setTick]     = useState(0)

  const fetchStats = async () => {
    try {
      const [todayEntries, activeEntries, alertEntries] = await Promise.all([
        getTodayEntries(),
        getActiveEntries(),
        getAlertEntries(),
      ])
      const income = todayEntries.reduce((acc, e) => acc + (Number(e.total) || 0), 0)
      setStats({ dailyIncome: income, latest: activeEntries, alerts: alertEntries })
    } catch (err) {
      console.error('[Dashboard] Error cargando stats:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Actualizar reloj del timeline cada 10s
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 10000)

    // Suscripción realtime: refrescar cuando cambien entradas
    const unsub = subscribeEntries(() => fetchStats())

    return () => {
      clearInterval(interval)
      unsub()
    }
  }, [])

  const calculateTimeline = (entry) => {
    const now   = Date.now()
    const start = entry.entryTime

    if (entry.serviceType === 'Diario') {
      const elapsedHrs = (now - start) / (1000 * 60 * 60)
      const progress   = Math.min((elapsedHrs / 24) * 100, 100)
      return {
        progress,
        label: `${Math.floor(elapsedHrs)}h ${Math.floor((elapsedHrs % 1) * 60)}m`,
        color: progress > 80 ? 'var(--warning)' : 'var(--brand-primary)',
      }
    } else {
      const total       = entry.nextPaymentDate - start
      const elapsed     = now - start
      const progress    = Math.min((elapsed / total) * 100, 100)
      const remainingMs = entry.nextPaymentDate - now
      const remainingHrs = remainingMs / (1000 * 60 * 60)
      const isExpired   = remainingMs < 0
      return {
        progress: isExpired ? 100 : progress,
        label:    isExpired
          ? 'VENCIDO'
          : `${Math.floor(remainingHrs / 24)}d ${Math.floor(remainingHrs % 24)}h rest.`,
        color: isExpired
          ? 'var(--danger)'
          : progress > 90 ? 'var(--warning)' : 'var(--success)',
      }
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: `${color}20`, color }}>
        <Icon size={28} />
      </div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>{title}</p>
        <h3 style={{ margin: 0 }}>{value}</h3>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ── Tarjetas de métricas ── */}
      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard title="Cupos Libres"   value={capacity.total - capacity.occupied} icon={CheckCircle} color="var(--success)" />
        <StatCard title="Hoy Cobrado"    value={`$${stats.dailyIncome.toFixed(2)}`} icon={DollarSign}  color="var(--brand-primary)" />
        <StatCard title="Vencimientos"   value={stats.alerts.length}                icon={AlertTriangle} color="var(--danger)" />
      </div>

      {/* ── Timeline de estancias activas ── */}
      <div className="card">
        <div className="flex-between">
          <h3><Timer size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Monitoreo de Estancias</h3>
          {!isCajaOpen && <span style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 'bold' }}>SISTEMA BLOQUEADO — ABRIR CAJA</span>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader size={28} style={{ margin: '0 auto', display: 'block', color: 'var(--brand-primary)' }} />
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Cargando datos desde Supabase...</p>
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {stats.latest.map(entry => {
              const tl = calculateTimeline(entry)
              return (
                <div key={entry.id} style={{ padding: '1rem', background: 'var(--bg-accent)15', borderRadius: '8px' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{entry.plate}</span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        • {entry.clientName || 'Desconocido'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 'bold', color: tl.color,
                      background: `${tl.color}15`, padding: '0.2rem 0.5rem', borderRadius: '4px'
                    }}>
                      {tl.label}
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-accent)', borderRadius: '3px' }}>
                    <div style={{
                      width: `${tl.progress}%`, height: '100%', background: tl.color,
                      borderRadius: '3px', transition: 'width 1s linear'
                    }} />
                  </div>

                  <div className="flex-between" style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span>{entry.vehicleType} | {entry.serviceType}</span>
                    <span>Ingreso: {new Date(entry.entryTime).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )
            })}
            {stats.latest.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No hay vehículos activos registrados
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
