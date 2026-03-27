import React, { useState, useEffect, useRef } from 'react'
import { searchClients, createClient } from '../services/clientesService'
import { getRates } from '../services/tarifasService'
import { createEntry, countAllEntries, getActivePlanForClient } from '../services/entradasService'
import { savePhotos } from '../db/db'
import carData from '../data/carDatabase.json'
import { getNextPaymentDate } from '../utils/rateCalculator'
import { generateParkingTicket } from '../utils/ticketGenerator'
import {
  Camera, Save, UserPlus, Car, AlertTriangle, Search,
  ShieldCheck, Loader
} from 'lucide-react'

const CheckIn = ({ capacity, isCajaOpen }) => {
  const [step, setStep]                         = useState(1)
  const [hasActivePlan, setHasActivePlan]       = useState(false)
  const [saving, setSaving]                     = useState(false)
  const isFull = capacity.occupied >= capacity.total

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', clientId: null,
    plate: '', brand: '', model: '', year: new Date().getFullYear(),
    vehicleType: 'Cars', serviceType: 'Diario',
    photos: { front: null, back: null, left: null, right: null }
  })

  const [clientSuggestions, setClientSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions]     = useState(false)

  useEffect(() => {
    if (formData.name.length > 1 && !formData.clientId) {
      searchClients(formData.name).then(results => {
        setClientSuggestions(results)
        setShowSuggestions(true)
      }).catch(console.error)
    } else {
      setShowSuggestions(false)
    }
  }, [formData.name])

  const selectClient = async (client) => {
    try {
      const activePlan = await getActivePlanForClient(client.id)
      setFormData({
        ...formData,
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        clientId: client.id,
        serviceType: activePlan ? activePlan.serviceType : 'Diario',
      })
      setHasActivePlan(!!activePlan)
      setShowSuggestions(false)
    } catch (err) {
      console.error('Error verificando plan activo:', err.message)
    }
  }

  // ── Cámara ──────────────────────────────────────────
  const videoRef = useRef(null)
  const [cameraActive, setCameraActive]   = useState(false)
  const [activePhotoKey, setActivePhotoKey] = useState(null)

  const startCamera = async (key) => {
    setActivePhotoKey(key)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch { alert('Error accediendo a la cámara') }
  }

  const capturePhoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    setFormData(prev => ({ ...prev, photos: { ...prev.photos, [activePhotoKey]: dataUrl } }))
    stopCamera()
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
    }
    setCameraActive(false)
  }

  // ── Guardar ──────────────────────────────────────────
  const handleSave = async () => {
    if (!isCajaOpen) return alert('DEBE ABRIR CAJA PARA REGISTRAR ENTRADAS')
    if (isFull)      return alert('Estacionamiento Lleno')
    setSaving(true)

    try {
      // 1. Crear o reusar cliente
      let finalClientId = formData.clientId
      if (!finalClientId) {
        const newClient = await createClient({
          name:  formData.name,
          phone: formData.phone,
          email: formData.email || '',
        })
        finalClientId = newClient.id
      }

      // 2. Número de ticket
      const total        = await countAllEntries()
      const ticketNumber = (total + 1).toString().padStart(6, '0')

      // 3. Fecha de próximo pago
      const nextPay = hasActivePlan ? null : getNextPaymentDate(Date.now(), formData.serviceType)

      // 4. Calcular precio
      const rates    = await getRates()
      const rate     = rates.find(r => r.id === formData.vehicleType.toLowerCase()) || rates[0]
      const finalPrice = hasActivePlan
        ? 0
        : formData.serviceType === 'Diario'   ? rate.price6to6
        : formData.serviceType === 'Semanal'  ? rate.price24h * 5
        : rate.price24h * 15

      // 5. Crear entrada en Supabase
      const entry = await createEntry({
        ticketNumber,
        clientId:        finalClientId,
        plate:           formData.plate.toUpperCase(),
        brand:           formData.brand,
        model:           formData.model,
        year:            formData.year,
        vehicleType:     formData.vehicleType,
        serviceType:     formData.serviceType,
        entryTime:       Date.now(),
        nextPaymentDate: nextPay,
        status:          'active',
        total:           finalPrice,
      })

      // 6. Guardar fotos localmente (Dexie) por ticketNumber
      await savePhotos(ticketNumber, formData.photos)

      // 7. Generar ticket PDF
      const ticketDoc = await generateParkingTicket({
        id: entry.id, ticketNumber, plate: formData.plate.toUpperCase(),
        brand: formData.brand, model: formData.model, entryTime: Date.now(),
        serviceType: formData.serviceType, nextPaymentDate: nextPay,
        total: finalPrice, isSubscriber: hasActivePlan,
      })
      ticketDoc.save(`Ticket_${ticketNumber}.pdf`)

      alert(hasActivePlan ? '¡Acceso de Socio Permitido!' : '¡Ingreso y Cobro registrado!')
      window.location.reload()
    } catch (err) {
      alert('Error al registrar entrada: ' + err.message)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!isCajaOpen) {
    return (
      <div className="card text-center" style={{ padding: '4rem', color: 'var(--danger)' }}>
        <AlertTriangle size={60} style={{ margin: '0 auto 1.5rem' }} />
        <h2>ACCESO BLOQUEADO</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Debe abrir una sesión de caja para realizar cualquier operación.</p>
        <button className="btn btn-primary" style={{ marginTop: '2rem' }}>Ir a Caja</button>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* ── Pasos ── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: '4px',
            background: step >= s ? 'var(--brand-primary)' : 'var(--bg-accent)',
            borderRadius: '2px'
          }} />
        ))}
      </div>

      {/* ── Paso 1: Cliente ── */}
      {step === 1 && (
        <div>
          <h3><UserPlus size={20} /> Cliente</h3>
          <div className="autocomplete-container input-group">
            <label className="input-label">Nombre del Cliente</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value, clientId: null })}
                placeholder="Juan Perez..."
              />
              <Search size={18} style={{ position: 'absolute', right: '1rem', top: '0.8rem', color: 'var(--text-secondary)' }} />
            </div>
            {showSuggestions && (
              <div className="dropdown-list">
                {clientSuggestions.map(c => (
                  <div key={c.id} className="dropdown-item" onClick={() => selectClient(c)}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{c.name}</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasActivePlan && (
            <div style={{ background: 'var(--success)15', color: 'var(--success)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
              <ShieldCheck size={24} />
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Suscripción Activa Encontrada</p>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>Este cliente no pagará entrada en este momento.</p>
              </div>
            </div>
          )}

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Teléfono</label>
              <input type="text" value={formData.phone} disabled={!!formData.clientId} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" value={formData.email} disabled={!!formData.clientId} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {/* ── Paso 2: Vehículo ── */}
      {step === 2 && (
        <div>
          <h3><Car size={20} /> Vehículo</h3>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Placa</label>
              <input type="text" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Marca</label>
              <select value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                <option value="">Seleccionar...</option>
                {carData.brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Servicio</label>
              <select value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })} disabled={hasActivePlan}>
                <option value="Diario">Diario</option>
                <option value="Semanal">Semanal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Tipo de Vehículo</label>
              <select value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}>
                <option value="Cars">Auto</option>
                <option value="Minivan">Minivan</option>
                <option value="Luxury Cars">Luxury</option>
                <option value="Vans">Vans</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Paso 3: Fotos ── */}
      {step === 3 && (
        <div className="grid-2" style={{ gap: '1rem' }}>
          {['front', 'back', 'left', 'right'].map(key => (
            <div
              key={key}
              onClick={() => startCamera(key)}
              style={{
                aspectRatio: '16/9', border: '2px dashed var(--border)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden'
              }}
            >
              {formData.photos[key]
                ? <img src={formData.photos[key]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={key} />
                : <span style={{ color: 'var(--text-secondary)' }}>{key.toUpperCase()}</span>
              }
            </div>
          ))}
        </div>
      )}

      {/* ── Navegación ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>Atrás</button>}
        <div style={{ marginLeft: 'auto' }}>
          {step < 3
            ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Siguiente</button>
            : (
              <button
                className="btn btn-primary"
                style={{ background: hasActivePlan ? 'var(--brand-primary)' : 'var(--success)' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader size={20} /> : <Save size={20} />}
                {saving ? 'Guardando...' : hasActivePlan ? 'Aceptar Socio' : 'Cobrar e Ingresar'}
              </button>
            )
          }
        </div>
      </div>

      {/* ── Cámara overlay ── */}
      {cameraActive && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '90%', borderRadius: '12px' }} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={stopCamera} style={{ background: 'var(--danger)' }}>Cerrar</button>
            <button className="btn btn-primary" onClick={capturePhoto}>Capturar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckIn
