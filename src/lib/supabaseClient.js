import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

/**
 * Ejecuta una query de Supabase y lanza error si falla.
 * @param {Promise} queryPromise - Promise retornada por el builder de Supabase
 */
export async function supaQuery(queryPromise) {
  const { data, error } = await queryPromise
  if (error) {
    console.error('[Supabase Error]', error.message, error)
    throw new Error(error.message)
  }
  return data
}

/**
 * Cuenta filas de una tabla con filtros opcionales.
 */
export async function supaCount(table, filters = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val)
  }
  const { count, error } = await query
  if (error) {
    console.error('[Supabase Count Error]', error.message)
    throw new Error(error.message)
  }
  return count ?? 0
}
