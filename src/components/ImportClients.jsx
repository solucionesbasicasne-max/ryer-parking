import React, { useState } from 'react';
import { db } from '../db/db';
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import Papa from 'papaparse';

const ImportClients = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (const row of results.data) {
          try {
            // Basic validation
            if (!row.Nombre || !row.Telefono) {
              skipped++;
              continue;
            }

            // Duplicate check
            const exists = await db.clients
              .where('phone').equals(row.Telefono)
              .first();
            
            if (exists) {
              skipped++;
              continue;
            }

            await db.clients.add({
              name: row.Nombre,
              phone: row.Telefono,
              email: row.Correo || '',
              address: row.Direccion || ''
            });
            imported++;
          } catch (err) {
            errors.push(err.message);
          }
        }

        setStats({ imported, skipped, errors });
        setLoading(false);
        if (onComplete) onComplete();
      }
    });
  };

  return (
    <div className="card" style={{ background: 'var(--bg-secondary)', border: '2px dashed var(--border)' }}>
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <FileText size={40} color="var(--brand-primary)" style={{ marginBottom: '1rem' }} />
        <h3>Importación Masiva de Clientes</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Suba un archivo CSV con las columnas: <b>Nombre, Telefono, Direccion, Correo</b>
        </p>

        {!loading && !stats && (
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={18} /> Seleccionar Archivo CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        )}

        {loading && <p>Procesando datos...</p>}

        {stats && (
          <div style={{ marginTop: '1rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle size={16} /> <b>{stats.imported}</b> Importados
              </div>
              <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={16} /> <b>{stats.skipped}</b> Omitidos (Duplicados o Inválidos)
              </div>
            </div>
            <button className="btn btn-sm" style={{ width: '100%' }} onClick={() => setStats(null)}>
              Cerrar Resultado
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportClients;
