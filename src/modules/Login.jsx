import React, { useState } from 'react';
import { db } from '../db/db';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const user = await db.users
      .where('username').equals(username)
      .and(u => u.password === password)
      .first();

    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ width: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '60px', height: '60px', background: 'var(--brand-primary)20', 
            borderRadius: '50%', color: 'var(--brand-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
          }}>
            <Lock size={30} />
          </div>
          <h2>Ryer Parking</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Ingreso al Sistema</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="input-group">
            <label className="input-label">Usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '0.9rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                style={{ paddingLeft: '2.8rem' }}
                placeholder="ej. admin" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '0.9rem', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                style={{ paddingLeft: '2.8rem' }}
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--danger)15', padding: '0.75rem', borderRadius: '8px'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}>
            <LogIn size={20} /> Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
