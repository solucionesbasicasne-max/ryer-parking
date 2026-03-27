import { supabase, supaQuery } from '../lib/supabaseClient'

const mapFromDb = (r) => ({
  id:       r.id,
  type:     r.type,
  price6to6: Number(r.price_6to6) || 0,
  price12h:  Number(r.price_12h)  || 0,
  price24h:  Number(r.price_24h)  || 0,
  isActive:  r.is_active,
})

/** Retorna todas las tarifas ordenadas por id */
export const getRates = async () => {
  const data = await supaQuery(supabase.from('rates').select('*').order('id'))
  return data.map(mapFromDb)
}

/** Actualiza precios de una tarifa */
export const updateRate = async (id, updates) => {
  const { data, error } = await supabase
    .from('rates')
    .update({
      price_6to6: parseFloat(updates.price6to6),
      price_12h:  parseFloat(updates.price12h),
      price_24h:  parseFloat(updates.price24h),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapFromDb(data)
}

/** Activa o desactiva una tarifa */
export const toggleRate = async (id, isActive) => {
  const { data, error } = await supabase
    .from('rates')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapFromDb(data)
}
