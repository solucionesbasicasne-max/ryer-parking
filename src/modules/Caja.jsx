import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { Wallet, LogIn, LogOut, TrendingUp, AlertCircle } from 'lucide-react';

const Caja = ({ setIsCajaOpen }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [summary, setSummary] = useState({ totalSales: 0 });

  const fetchSession = async () => {
    const session = await db.sessions.where('status').equals('open').first();
    if (session) {
      setActiveSession(session);
      const sales = await db.entries
        .where('exitTime').above(session.openTime)
        .filter(e => e.status === 'completed')
        .toArray();
      const total = sales.reduce((acc, curr) => acc + (curr.total || 0), 0);
      setSummary({ totalSales: total });
      setIsCajaOpen(true);
    } else {
      setIsCajaOpen(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleOpen = async () => {
    if (!openingBalance) return alert('Ingrese saldo inicial');
    const sessionId = await db.sessions.add({
      openTime: Date.now(),
      initialBalance: parseFloat(openingBalance),
      status: 'open'
    });
    alert('¡Caja abierta con éxito!');
    setIsCajaOpen(true);
    fetchSession();
  };

  const handleClose = async () => {
    if (!closingBalance) return alert('Ingrese saldo final');
    const expected = activeSession.initialBalance + summary.totalSales;
    const actual = parseFloat(closingBalance);
    const difference = actual - expected;

    await db.sessions.update(activeSession.id, {
      closeTime: Date.now(),
      finalBalance: actual,
      expectedBalance: expected,
      difference: difference,
      status: 'closed'
    });

    alert(`Caja cerrada. Diferencia: $${difference.toFixed(2)}`);
    setIsCajaOpen(false);
    setActiveSession(null);
    setOpeningBalance('');
    setClosingBalance('');
  };

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
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Debe abrir una sesión para operar el sistema hoy.</p>
          
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="input-label">Saldo Inicial (Efectivo)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleOpen}>
            <LogIn size={20} /> Abrir Turno de Caja
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <div>
              <h3>Caja en Operación</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Abierta el: {new Date(activeSession.openTime).toLocaleString()}</p>
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
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>+ ${summary.totalSales.toFixed(2)}</p>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)', border: '1px dashed var(--brand-primary)', marginBottom: '2rem' }}>
            <div className="flex-between">
              <div>
                <p className="input-label">Esperado en Caja</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${(activeSession.initialBalance + summary.totalSales).toFixed(2)}</p>
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

          <button className="btn btn-primary btn-lg" style={{ width: '100%', background: 'var(--danger)', marginTop: '1rem' }} onClick={handleClose}>
            <LogOut size={20} /> Cerrar Caja y Generar Corte
          </button>
        </div>
      )}
    </div>
  );
};

export default Caja;
