import React, { useState, useEffect } from 'react'
import { getRates, updateRate, toggleRate } from '../services/tarifasService'
import { getCapacidad, setCapacidad } from '../services/configService'
import { Settings as SettingsIcon, Save, Plus, Power, Edit3, X, Loader } from 'lucide-react'

const Settings = () => {
  const [capacity, setCapacityState] = useState(0)
  const [rates, setRates]            = useState([])
  const [editingRate, setEditingRate] = useState(null)
  const [loading, setLoading]        = useState(true)
  const [saving, setSaving]          = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cap, allRates] = await Promise.all([getCapacidad(), getRates()])
        setCapacityState(cap)
        setRates(allRates)
      } catch (err) {
        console.error('[Settings] Error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const saveCapacity = async () => {
    setSaving(true)
    try {
      await setCapacidad(capacity)
      alert('Configuración guardada')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateRate(editingRate.id, {
        price6to6: editingRate.price6to6,
        price12h:  editingRate.price12h,
        price24h:  editingRate.price24h,
      })
      setRates(rates.map(r => r.id === updated.id ? updated : r))
      setEditingRate(null)
      alert('Tarifa actualizada')
    } catch (err) {
      alert('Error al actualizar tarifa: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleRate = async (rate) => {
    try {
      const updated = await toggleRate(rate.id, !rate.isActive)
      setRates(rates.map(r => r.id === updated.id ? updated : r))
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <Loader size={32} style={{ margin: '0 auto', display: 'block', color: 'var(--brand-primary)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ── Capacidad ── */}
      <div className="card">
        <h3>General</h3>
        <div className="input-group" style={{ marginTop: '1rem' }}>
          <label className="input-label">Capacidad Total (Cajones)</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="number"
              value={capacity}
              onChange={e => setCapacityState(e.target.value)}
            />
            <button className="btn btn-primary" onClick={saveCapacity} disabled={saving}>
              {saving ? <Loader size={18} /> : <Save size={18} />} Guardar
            </button>
          </div>
        </div>
      </div>

      {/* ── Editar Tarifa ── */}
      {editingRate && (
        <div className="card" style={{ border: '1px solid var(--brand-primary)' }}>
          <div className="flex-between">
            <h3>Editar Tarifa: {editingRate.type}</h3>
            <button onClick={() => setEditingRate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
          </div>
          <form onSubmit={handleUpdateRate} className="grid-2" style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Precio 6am-6pm</label>
              <input type="number" step="0.01" value={editingRate.price6to6} onChange={e => setEditingRate({ ...editingRate, price6to6: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Precio 12 hrs</label>
              <input type="number" step="0.01" value={editingRate.price12h} onChange={e => setEditingRate({ ...editingRate, price12h: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Precio 24 hrs</label>
              <input type="number" step="0.01" value={editingRate.price24h} onChange={e => setEditingRate({ ...editingRate, price24h: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={18} /> : <Save size={18} />} Actualizar Precios
            </button>
          </form>
        </div>
      )}

      {/* ── Tabla de Tarifas ── */}
      <div className="card">
        <div className="flex-between">
          <h3>Tarifas</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.5rem 0' }}>Tipo</th>
              <th>6-6</th>
              <th>12h</th>
              <th>24h</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(rate => (
              <tr key={rate.id} style={{ borderBottom: '1px solid var(--border)', opacity: rate.isActive ? 1 : 0.5 }}>
                <td style={{ padding: '1rem 0' }}><b>{rate.type}</b></td>
                <td>${rate.price6to6}</td>
                <td>${rate.price12h}</td>
                <td>${rate.price24h}</td>
                <td>
                  <button
                    onClick={() => handleToggleRate(rate)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: rate.isActive ? 'var(--success)' : 'var(--text-secondary)' }}
                  >
                    <Power size={18} />
                  </button>
                </td>
                <td style={{ padding: '0.5rem 0' }}>
                  <button className="btn" onClick={() => setEditingRate({ ...rate })} style={{ padding: '0.4rem' }}>
                    <Edit3 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Settings
