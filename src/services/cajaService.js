import { supabase } from '../lib/supabaseClient'

const isoToMs = (iso) => iso ? new Date(iso).getTime() : null
const msToIso = (ms)  => ms  ? new Date(ms).toISOString() : null

const mapFromDb = (s) => ({
  id:              s.id,
  openTime:        isoToMs(s.open_time),
  closeTime:       isoToMs(s.close_time),
  initialBalance:  Number(s.initial_balance) || 0,
  finalBalance:    Number(s.final_balance)   || 0,
  expectedBalance: Number(s.expected_balance) || 0,
  difference:      Number(s.difference)      || 0,
  status:          s.status,
})

/** Retorna la sesión de caja abierta, o null si no hay ninguna */
export const getSesionActiva = async () => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'open')
    .order('open_time', { ascending: false })
    .limit(1)
  if (error) throw new Error(error.message)
  return data?.[0] ? mapFromDb(data[0]) : null
}

/** Abre una nueva sesión de caja con el saldo inicial dado */
export const abrirSesion = async (saldoInicial) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ initial_balance: parseFloat(saldoInicial), status: 'open' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapFromDb(data)
}

/** Cierra la sesión activa calculando diferencia */
export const cerrarSesion = async (id, saldoFinal, saldoEsperado) => {
  const saldoFinalNum = parseFloat(saldoFinal)
  const diferencia    = saldoFinalNum - saldoEsperado
  const { data, error } = await supabase
    .from('sessions')
    .update({
      close_time:       new Date().toISOString(),
      final_balance:    saldoFinalNum,
      expected_balance: saldoEsperado,
      difference:       diferencia,
      status:           'closed',
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapFromDb(data)
}

/** Suma todas las ventas completadas desde que se abrió la sesión */
export const getTotalVentasSesion = async (openTimeMs) => {
  const { data, error } = await supabase
    .from('entries')
    .select('total')
    .eq('status', 'completed')
    .gte('exit_time', msToIso(openTimeMs))
  if (error) throw new Error(error.message)
  return (data || []).reduce((acc, e) => acc + (Number(e.total) || 0), 0)
}
