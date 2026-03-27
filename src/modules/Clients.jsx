import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { Search, UserPlus, Phone, Mail, Edit2, Trash2, User, Upload, X, Save } from 'lucide-react';
import ImportClients from '../components/ImportClients';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchClients = async () => setClients(await db.clients.toArray());

  useEffect(() => {
    fetchClients();
  }, []);

  const deleteClient = async (id) => {
    if (confirm('¿Eliminar cliente?')) {
      await db.clients.delete(id);
      fetchClients();
    }
  };

  const startEdit = (client) => setEditingClient({ ...client });

  const handleUpdate = async (e) => {
    e.preventDefault();
    await db.clients.update(editingClient.id, {
      name: editingClient.name,
      phone: editingClient.phone,
      email: editingClient.email
    });
    setEditingClient(null);
    fetchClients();
    alert('Cliente actualizado');
  };

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative', maxWidth: '400px' }}>
          <input type="text" placeholder="Buscar por nombre o teléfono..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <Search style={{ position: 'absolute', right: '1rem', top: '0.75rem', color: 'var(--text-secondary)' }} />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => setShowImport(!showImport)}><Upload size={20} /> Importar</button>
          <button className="btn btn-primary"><UserPlus size={20} /> Nuevo Cliente</button>
        </div>
      </div>

      {showImport && (
        <div style={{ marginBottom: '2rem' }}>
          <ImportClients onComplete={() => { fetchClients(); setShowImport(false); }} />
        </div>
      )}

      {editingClient && (
         <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--brand-primary)' }}>
           <div className="flex-between">
             <h3>Editar Cliente</h3>
             <button onClick={() => setEditingClient(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X /></button>
           </div>
           <form onSubmit={handleUpdate} className="grid-2" style={{ marginTop: '1rem' }}>
             <div className="input-group">
               <label className="input-label">Nombre</label>
               <input type="text" value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} required />
             </div>
             <div className="input-group">
               <label className="input-label">Teléfono</label>
               <input type="text" value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} required />
             </div>
             <div className="input-group" style={{ gridColumn: 'span 2' }}>
               <label className="input-label">Email</label>
               <input type="email" value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
             </div>
             <button type="submit" className="btn btn-primary"><Save size={18} /> Guardar Cambios</button>
           </form>
         </div>
      )}

      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filtered.map(client => (
          <div key={client.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '50px', height: '50px', background: 'var(--bg-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="var(--brand-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>{client.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{client.phone}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" onClick={() => startEdit(client)} style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
              <button className="btn" onClick={() => deleteClient(client.id)} style={{ padding: '0.5rem', color: 'var(--danger)' }}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clients;
