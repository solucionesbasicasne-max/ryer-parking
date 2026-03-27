import React, { useState } from 'react';
import { db } from '../db/db';
import { Search, QrCode, LogOut, Clock, DollarSign, Camera } from 'lucide-react';
import { calculateParkingPrice } from '../utils/rateCalculator';

const CheckOut = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEntry, setActiveEntry] = useState(null);

  const findEntry = async (term) => {
    const entry = await db.entries
      .where('plate').equals(term.toUpperCase())
      .filter(e => e.status === 'active')
      .first();
    
    if (entry) {
      const client = await db.clients.get(entry.clientId);
      const allRates = await db.rates.toArray();
      const exitTime = Date.now();
      const total = calculateParkingPrice(entry.vehicleType, entry.entryTime, exitTime, allRates, entry.serviceType);
      setActiveEntry({ ...entry, exitTime, calculatedTotal: total, clientName: client ? client.name : 'Desconocido' });
    } else {
      alert('Vehículo no encontrado o ya finalizado.');
    }
  };

  const handleCheckout = async () => {
    await db.entries.update(activeEntry.id, {
      status: 'completed',
      exitTime: activeEntry.exitTime,
      total: activeEntry.calculatedTotal
    });
    alert('¡Salida procesada con éxito! El espacio ha sido liberado.');
    setActiveEntry(null);
    setSearchTerm('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {!activeEntry ? (
        <div className="card">
          <h3>Procesar Salida de Vehículo</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Ingrese la placa o escanee el ticket QR para calcular el cobro.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="text" placeholder="ABC-123" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <Search size={20} style={{ position: 'absolute', right: '1rem', top: '0.75rem', color: 'var(--text-secondary)' }} />
            </div>
            <button className="btn btn-primary" onClick={() => findEntry(searchTerm)}>Calcular Cobro</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="flex-between">
            <h2>Liquidación de Estancia</h2>
            <span className="card" style={{ padding: '0.5rem 1rem', background: 'var(--brand-primary)15', border: '1px solid var(--brand-primary)30', color: 'var(--brand-primary)', fontWeight: 'bold' }}>TICKET #{activeEntry.ticketNumber}</span>
          </div>

          <div className="grid-2" style={{ marginTop: '2rem', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <p className="input-label">Datos del Vehículo</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--bg-accent)', borderRadius: '6px', fontWeight: 'bold' }}>{activeEntry.plate}</div>
                  <p>{activeEntry.brand} {activeEntry.model}</p>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}><b>Propietario:</b> {activeEntry.clientName}</p>
              </div>
              <div>
                <p className="input-label">Registro de Estancia</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Clock size={16} /> <span><b>Entrada:</b> {new Date(activeEntry.entryTime).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <LogOut size={16} /> <span><b>Salida:</b> {new Date(activeEntry.exitTime).toLocaleString()}</span>
                </div>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <p className="input-label">Evidencia Visual</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {Object.entries(activeEntry.photos).map(([key, src]) => src && (
                    <img key={key} src={src} style={{ width: '100%', borderRadius: '4px', aspectRatio: '4/3', objectFit: 'cover' }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Resumen de Pago</h3>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <span>Tipo de Servicio:</span>
                <span style={{ fontWeight: 'bold' }}>{activeEntry.serviceType}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <span>Tarifa Aplicada:</span>
                <span style={{ fontWeight: 'bold' }}>{activeEntry.vehicleType}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
              <div className="flex-between" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)' }}>
                <span>Total:</span>
                <span>${activeEntry.calculatedTotal.toFixed(2)}</span>
              </div>
              
              <button 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', marginTop: '2rem', background: 'var(--success)' }}
                onClick={handleCheckout}
              >
                Registrar Pago y Salida
              </button>
              <button className="btn" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setActiveEntry(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckOut;
