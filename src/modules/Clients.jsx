import React, { useState, useEffect } from 'react'
import {
  getClients, createClient, updateClient, deleteClient, subscribeClients
} from '../services/clientesService'
import { Search, UserPlus, Phone, Edit2, Trash2, User, Upload, X, Save, Loader } from 'lucide-react'
import ImportClients from '../components/ImportClients'

const Clients = () => {
  const [clients, setClients]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [newClient, setNewClient]   = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving]         = useState(false)

  const fetchClients = async () => {
    try {
      const data = await getClients()
      setClients(data)
    } catch (err) {
      console.error('Error cargando clientes:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
    // Suscripción en tiempo real
    const unsub = subscribeClients(setClients)
    return unsub
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createClient(newClient)
      setNewClient({ name: '', phone: '', email: '' })
      setShowForm(false)
      // La suscripción realtime actualizará la lista automáticamente
    } catch (err) {
      alert('Error al crear cliente: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateClient(editingClient.id, {
        name:  editingClient.name,
        phone: editingClient.phone,
        email: editingClient.email,
      })
      setEditingClient(null)
      fetchClients()
    } catch (err) {
      alert('Error al actualizar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      await deleteClient(id)
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
    }
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  )

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* ── Barra de búsqueda y acciones ── */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search style={{ position: 'absolute', right: '1rem', top: '0.75rem', color: 'var(--text-secondary)' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn" onClick={() => setShowImport(!showImport)}>
            <Upload size={18} /> Importar CSV
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingClient(null) }}>
            <UserPlus size={18} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* ── Importación CSV ── */}
      {showImport && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ImportClients onComplete={() => { fetchClients(); setShowImport(false) }} />
        </div>
      )}

      {/* ── Formulario Nuevo Cliente ── */}
      {showForm && !editingClient && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--brand-primary)' }}>
          <div className="flex-between">
            <h3>Nuevo Cliente</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X /></button>
          </div>
          <form onSubmit={handleCreate} className="grid-2" style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre *</label>
              <input type="text" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Teléfono *</label>
              <input type="text" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} required />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Email</label>
              <input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={18} className="spin" /> : <Save size={18} />} Guardar Cliente
            </button>
          </form>
        </div>
      )}

      {/* ── Formulario Editar Cliente ── */}
      {editingClient && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--brand-primary)' }}>
          <div className="flex-between">
            <h3>Editar Cliente</h3>
            <button onClick={() => setEditingClient(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X /></button>
          </div>
          <form onSubmit={handleUpdate} className="grid-2" style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <input type="text" value={editingClient.name} onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Teléfono</label>
              <input type="text" value={editingClient.phone} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} required />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Email</label>
              <input type="email" value={editingClient.email} onChange={e => setEditingClient({ ...editingClient, email: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={18} /> : <Save size={18} />} Guardar Cambios
            </button>
          </form>
        </div>
      )}

      {/* ── Lista de Clientes ── */}
      {loading ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <Loader size={32} style={{ margin: '0 auto', display: 'block', color: 'var(--brand-primary)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando clientes desde Supabase...</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
              {searchTerm ? 'Sin resultados para la búsqueda.' : 'No hay clientes registrados.'}
            </p>
          )}
          {filtered.map(client => (
            <div key={client.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', background: 'var(--bg-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={24} color="var(--brand-primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{client.phone}</p>
                {client.email && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{client.email}</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn" onClick={() => { setEditingClient({ ...client }); setShowForm(false) }} style={{ padding: '0.5rem' }}>
                  <Edit2 size={16} />
                </button>
                <button className="btn" onClick={() => handleDelete(client.id)} style={{ padding: '0.5rem', color: 'var(--danger)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Clients
