import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { Settings as SettingsIcon, Save, Plus, Trash2, Power, Edit3, X } from 'lucide-react';

const Settings = () => {
  const [capacity, setCapacity] = useState(0);
  const [rates, setRates] = useState([]);
  const [editingRate, setEditingRate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const cap = (await db.config.get('capacity'))?.value || 50;
      const allRates = await db.rates.toArray();
      setCapacity(cap);
      setRates(allRates);
    };
    fetchData();
  }, []);

  const saveCapacity = async () => {
    await db.config.put({ id: 'capacity', value: parseInt(capacity) });
    alert('Configuración guardada');
  };

  const handleUpdateRate = async (e) => {
    e.preventDefault();
    await db.rates.update(editingRate.id, {
      price6to6: parseFloat(editingRate.price6to6),
      price12h: parseFloat(editingRate.price12h),
      price24h: parseFloat(editingRate.price24h)
    });
    setEditingRate(null);
    setRates(await db.rates.toArray());
    alert('Tarifa actualizada');
  };

  const toggleRate = async (rate) => {
    await db.rates.update(rate.id, { isActive: !rate.isActive });
    setRates(await db.rates.toArray());
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card">
        <h3>General</h3>
        <div className="input-group" style={{ marginTop: '1rem' }}>
          <label className="input-label">Capacidad Total (Cajones)</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
            <button className="btn btn-primary" onClick={saveCapacity}><Save size={18} /> Guardar</button>
          </div>
        </div>
      </div>

      {editingRate && (
        <div className="card" style={{ border: '1px solid var(--brand-primary)' }}>
          <div className="flex-between"><h3>Editar Tarifa: {editingRate.type}</h3><button onClick={() => setEditingRate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button></div>
          <form onSubmit={handleUpdateRate} className="grid-2" style={{ marginTop: '1rem' }}>
             <div className="input-group"><label className="input-label">Precio 6am-6pm</label><input type="number" value={editingRate.price6to6} onChange={e => setEditingRate({...editingRate, price6to6: e.target.value})} required /></div>
             <div className="input-group"><label className="input-label">Precio 12 hrs</label><input type="number" value={editingRate.price12h} onChange={e => setEditingRate({...editingRate, price12h: e.target.value})} required /></div>
             <div className="input-group"><label className="input-label">Precio 24 hrs</label><input type="number" value={editingRate.price24h} onChange={e => setEditingRate({...editingRate, price24h: e.target.value})} required /></div>
             <button type="submit" className="btn btn-primary"><Save size={18} /> Actualizar Precios</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="flex-between"><h3>Tarifas</h3><button className="btn btn-primary btn-sm"><Plus size={18} /> Nueva</button></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}><th>Tipo</th><th>6-6</th><th>12h</th><th>24h</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rates.map(rate => (
              <tr key={rate.id} style={{ borderBottom: '1px solid var(--border)', opacity: rate.isActive ? 1 : 0.5 }}>
                <td style={{ padding: '1rem 0' }}><b>{rate.type}</b></td>
                <td>${rate.price6to6}</td><td>${rate.price12h}</td><td>${rate.price24h}</td>
                <td><button onClick={() => toggleRate(rate)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rate.isActive ? 'var(--success)' : 'var(--text-secondary)' }}><Power size={18} /></button></td>
                <td style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0' }}>
                  <button className="btn" onClick={() => setEditingRate({...rate})} style={{ padding: '0.4rem' }}><Edit3 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Settings;
