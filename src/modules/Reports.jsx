import React, { useState, useEffect } from 'react'
import { getSemanaEntries, getAllEntries } from '../services/entradasService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileDown, TrendingUp, Car, Loader } from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const Reports = () => {
  const [data, setData]       = useState([])
  const [metrics, setMetrics] = useState({ totalIncome: 0, totalCars: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const semanaEntries = await getSemanaEntries()
        const allEntries    = await getAllEntries()

        const income = allEntries.reduce((acc, e) => acc + (e.total || 0), 0)

        // Agrupar por día (últimos 7 días)
        const days = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' })
          days[dayStr] = 0
        }
        semanaEntries.forEach(e => {
          const d = new Date(e.exitTime).toLocaleDateString('es-ES', { weekday: 'short' })
          if (days[d] !== undefined) days[d] += e.total
        })

        setData(Object.keys(days).map(key => ({ name: key, total: days[key] })))
        setMetrics({ totalIncome: income, totalCars: allEntries.length })
      } catch (err) {
        console.error('[Reports] Error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const exportPDF = async () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('REPORTE DE INGRESOS - RYER PARKING', 20, 20)
    doc.setFontSize(12)
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 30)
    doc.text(`Total Acumulado: $${metrics.totalIncome.toFixed(2)}`, 20, 35)
    doc.text(`Vehículos Registrados: ${metrics.totalCars}`, 20, 40)

    const entries = await getAllEntries()
    doc.autoTable({
      startY: 50,
      head: [['Ticket', 'Placa', 'Vehículo', 'Entrada', 'Estado', 'Total']],
      body: entries.map(e => [
        e.ticketNumber,
        e.plate,
        `${e.brand} ${e.model}`,
        new Date(e.entryTime).toLocaleString(),
        e.status?.toUpperCase(),
        `$${(e.total || 0).toFixed(2)}`,
      ]),
    })
    doc.save('Reporte_Ryer_Parking.pdf')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <h2>Reportes Financieros</h2>
        <button className="btn btn-primary" onClick={exportPDF} disabled={loading}>
          <FileDown size={20} /> Exportar Reporte (PDF)
        </button>
      </div>

      {loading ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <Loader size={32} style={{ margin: '0 auto', display: 'block', color: 'var(--brand-primary)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando datos desde Supabase...</p>
        </div>
      ) : (
        <div className="grid-2">
          <div className="card" style={{ height: '300px' }}>
            <h3>Ingresos de la Semana</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--brand-primary)' }}
                />
                <Bar dataKey="total" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="card flex-between" style={{ background: 'var(--success)10' }}>
              <div>
                <p className="input-label">Ingresos Totales</p>
                <h2 style={{ color: 'var(--success)', margin: 0 }}>${metrics.totalIncome.toFixed(2)}</h2>
              </div>
              <TrendingUp size={32} color="var(--success)" />
            </div>
            <div className="card flex-between" style={{ background: 'var(--brand-primary)10' }}>
              <div>
                <p className="input-label">Vehículos Totales</p>
                <h2 style={{ color: 'var(--brand-primary)', margin: 0 }}>{metrics.totalCars}</h2>
              </div>
              <Car size={32} color="var(--brand-primary)" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
