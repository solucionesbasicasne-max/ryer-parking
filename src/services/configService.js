import { supabase } from '../lib/supabaseClient'

/** Obtiene la capacidad del estacionamiento de Supabase */
export const getCapacidad = async () => {
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'capacity')
    .maybeSingle()
  if (error) return 50
  return parseInt(data?.value, 10) || 50
}

/** Guarda la capacidad del estacionamiento en Supabase */
export const setCapacidad = async (valor) => {
  const { error } = await supabase
    .from('config')
    .upsert({ key: 'capacity', value: String(parseInt(valor, 10)) })
  if (error) throw new Error(error.message)
}
