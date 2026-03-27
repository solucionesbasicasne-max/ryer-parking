import { supabase, supaQuery, supaCount } from '../lib/supabaseClient'

// ── Helpers de conversión ─────────────────────────────────────────
const isoToMs  = (iso) => iso ? new Date(iso).getTime() : null
const msToIso  = (ms)  => ms  ? new Date(ms).toISOString() : null

/** Convierte una fila de Supabase al formato camelCase que usa la app */
const mapFromDb = (e) => ({
  id:              e.id,
  ticketNumber:    e.ticket_number,
  clientId:        e.client_id,
  plate:           e.plate,
  brand:           e.brand,
  model:           e.model,
  year:            e.year,
  vehicleType:     e.vehicle_type,
  serviceType:     e.service_type,
  entryTime:       isoToMs(e.entry_time),
  exitTime:        isoToMs(e.exit_time),
  nextPaymentDate: isoToMs(e.next_payment_date),
  status:          e.status,
  total:           Number(e.total) || 0,
  clientName:      e.clients?.name || null,
})

/** Convierte el objeto camelCase de la app al formato snake_case para Supabase */
const mapToDb = (e) => ({
  ticket_number:     e.ticketNumber,
  client_id:         e.clientId      || null,
  plate:             e.plate,
  brand:             e.brand         || '',
  model:             e.model         || '',
  year:              e.year          || null,
  vehicle_type:      e.vehicleType,
  service_type:      e.serviceType,
  entry_time:        msToIso(e.entryTime),
  exit_time:         msToIso(e.exitTime),
  next_payment_date: msToIso(e.nextPaymentDate),
  status:            e.status        || 'active',
  total:             e.total         || 0,
})

// ── Queries ───────────────────────────────────────────────────────

/** Entradas activas con nombre del cliente (JOIN) */
export const getActiveEntries = async () => {
  const { data, error } = await supabase
    .from('entries')
    .select('*, clients(name)')
    .eq('status', 'active')
    .order('entry_time', { ascending: true })
  if (error) throw new Error(error.message)
  return data.map(mapFromDb)
}

/** Cuenta cuántas entradas están activas */
export const countActiveEntries = () => supaCount('entries', { status: 'active' })

/** Cuenta el total de entradas (para numerar tickets) */
export const countAllEntries = () => supaCount('entries')

/** Busca una entrada activa por placa */
export const getEntryByPlate = async (plate) => {
  const { data, error } = await supabase
    .from('entries')
    .select('*, clients(name)')
    .eq('plate', plate.toUpperCase())
    .eq('status', 'active')
    .order('entry_time', { ascending: false })
    .limit(1)
  if (error) throw new Error(error.message)
  return data?.[0] ? mapFromDb(data[0]) : null
}

/** Entradas completadas hoy (para calcular ingresos del día) */
export const getTodayEntries = async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('entries')
    .select('total')
    .eq('status', 'completed')
    .gte('exit_time', today.toISOString())
  if (error) throw new Error(error.message)
  return data
}

/** Entradas completadas en los últimos 7 días (para reportes) */
export const getSemanaEntries = async () => {
  const start = new Date()
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('entries')
    .select('exit_time, total')
    .eq('status', 'completed')
    .gte('exit_time', start.toISOString())
  if (error) throw new Error(error.message)
  return data.map(e => ({ exitTime: isoToMs(e.exit_time), total: Number(e.total) || 0 }))
}

/** Todas las entradas (para exportar en reportes) */
export const getAllEntries = async () => {
  const { data, error } = await supabase
    .from('entries')
    .select('ticket_number, plate, brand, model, entry_time, exit_time, status, total')
    .order('entry_time', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map(e => ({
    ticketNumber: e.ticket_number,
    plate:        e.plate,
    brand:        e.brand,
    model:        e.model,
    entryTime:    isoToMs(e.entry_time),
    exitTime:     isoToMs(e.exit_time),
    status:       e.status,
    total:        Number(e.total) || 0,
  }))
}

/** Entradas activas con vencimiento próximo (alertas del dashboard) */
export const getAlertEntries = async () => {
  const twoDays = new Date(Date.now() + 86400000 * 2).toISOString()
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('status', 'active')
    .not('next_payment_date', 'is', null)
    .lte('next_payment_date', twoDays)
  if (error) throw new Error(error.message)
  return data.map(mapFromDb)
}

/** Verifica si un cliente tiene un plan activo vigente */
export const getActivePlanForClient = async (clientId) => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .not('next_payment_date', 'is', null)
    .gt('next_payment_date', new Date().toISOString())
    .limit(1)
  if (error) throw new Error(error.message)
  return data?.[0] ? mapFromDb(data[0]) : null
}

/** Entradas completadas desde la apertura de caja (para calcular ventas) */
export const getEntradasBySesion = async (openTimeMs) => {
  const { data, error } = await supabase
    .from('entries')
    .select('total')
    .eq('status', 'completed')
    .gte('exit_time', msToIso(openTimeMs))
  if (error) throw new Error(error.message)
  return data
}

// ── Mutaciones ────────────────────────────────────────────────────

/** Crea una nueva entrada y retorna el objeto mapeado */
export const createEntry = async (data) => {
  const { data: entry, error } = await supabase
    .from('entries')
    .insert(mapToDb(data))
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapFromDb(entry)
}

/** Actualiza campos de una entrada. Soporta: status, total, exitTime */
export const updateEntry = async (id, updates) => {
  const dbUpdates = {}
  if (updates.status   !== undefined) dbUpdates.status    = updates.status
  if (updates.total    !== undefined) dbUpdates.total     = updates.total
  if (updates.exitTime !== undefined) dbUpdates.exit_time = msToIso(updates.exitTime)

  const { data, error } = await supabase
    .from('entries')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapFromDb(data)
}

// ── Realtime ─────────────────────────────────────────────────────

/** Suscripción en tiempo real a cambios en `entries`. Retorna función de limpieza. */
export const subscribeEntries = (callback) => {
  const channel = supabase
    .channel('public:entries')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
