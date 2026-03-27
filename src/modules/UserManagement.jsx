import React, { useState, useEffect } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../services/usuariosService'
import { UserCircle, UserPlus, Shield, Trash2, Edit2, X, Save, Loader } from 'lucide-react'

const UserManagement = () => {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [newUser, setNewUser]       = useState({ username: '', password: '', role: 'Operator' })
  const [editingUser, setEditingUser] = useState(null)

  const fetchUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      console.error('[UserManagement] Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAddUser = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createUser(newUser)
      setShowForm(false)
      setNewUser({ username: '', password: '', role: 'Operator' })
      fetchUsers()
    } catch (err) {
      alert('Error al crear usuario: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUser(editingUser.id, {
        username: editingUser.username,
        password: editingUser.password,
        role:     editingUser.role,
      })
      setEditingUser(null)
      fetchUsers()
      alert('Usuario actualizado')
    } catch (err) {
      alert('Error al actualizar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await deleteUser(id)
      fetchUsers()
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h3>Gestión de Usuarios Staff</h3>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingUser(null) }}>
          <UserPlus size={18} /> Agregar Usuario
        </button>
      </div>

      {/* ── Formulario Nuevo Usuario ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)' }}>
          <div className="flex-between">
            <h4>Nuevo Usuario</h4>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
          </div>
          <form onSubmit={handleAddUser} className="grid-2" style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Usuario</label>
              <input type="text" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Rol</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="Operator">Operador</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', paddingBottom: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader size={18} /> : <Save size={18} />} Guardar
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Formulario Editar Usuario ── */}
      {editingUser && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--brand-primary)' }}>
          <div className="flex-between">
            <h4>Editar: {editingUser.username}</h4>
            <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
          </div>
          <form onSubmit={handleUpdate} className="grid-2" style={{ marginTop: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre de Usuario</label>
              <input type="text" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Nueva Contraseña</label>
              <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Rol</label>
              <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="Operator">Operador</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={18} /> : <Save size={18} />} Actualizar
            </button>
          </form>
        </div>
      )}

      {/* ── Lista de Usuarios ── */}
      {loading ? (
        <div className="card text-center" style={{ padding: '2rem' }}>
          <Loader size={28} style={{ margin: '0 auto', display: 'block', color: 'var(--brand-primary)' }} />
        </div>
      ) : (
        <div className="grid-2">
          {users.map(u => (
            <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: u.role === 'Admin' ? 'var(--brand-primary)20' : 'var(--bg-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} color={u.role === 'Admin' ? 'var(--brand-primary)' : 'var(--text-secondary)'} />
                </div>
                <div>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>{u.username}</p>
                  <p style={{ fontSize: '0.75rem', color: u.role === 'Admin' ? 'var(--brand-primary)' : 'var(--text-secondary)', margin: 0 }}>{u.role}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn" onClick={() => { setEditingUser({ ...u, password: '' }); setShowForm(false) }} style={{ padding: '0.5rem' }}>
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn"
                  onClick={() => handleDelete(u.id)}
                  style={{ padding: '0.5rem', color: 'var(--danger)' }}
                  disabled={u.username === 'admin'}
                >
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

export default UserManagement
