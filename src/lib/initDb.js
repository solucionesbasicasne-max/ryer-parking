import { supabase } from './supabaseClient'

/**
 * Siembra los datos iniciales en Supabase si las tablas están vacías.
 * Se ejecuta una sola vez al primer arranque de la app.
 */
export const seedSupabase = async () => {
  try {
    // ── Tarifas ──────────────────────────────────────
    const { count: ratesCount } = await supabase
      .from('rates')
      .select('*', { count: 'exact', head: true })

    if ((ratesCount || 0) === 0) {
      await supabase.from('rates').insert([
        { id: 'cars',    type: 'Cars',        price_6to6: 20, price_12h: 25, price_24h: 30, is_active: true },
        { id: 'minivan', type: 'Minivan',     price_6to6: 25, price_12h: 30, price_24h: 35, is_active: true },
        { id: 'luxury',  type: 'Luxury Cars', price_6to6: 25, price_12h: 30, price_24h: 35, is_active: true },
        { id: 'vans',    type: 'Vans',        price_6to6: 30, price_12h: 35, price_24h: 40, is_active: true },
      ])
    }

    // ── Usuarios ─────────────────────────────────────
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if ((usersCount || 0) === 0) {
      await supabase.from('users').insert([
        { username: 'admin',    password: 'admin123', role: 'Admin' },
        { username: 'operator', password: 'op123',    role: 'Operator' },
      ])
    }

    // ── Configuración ────────────────────────────────
    const { data: configData } = await supabase
      .from('config')
      .select('key')
      .eq('key', 'capacity')
      .maybeSingle()

    if (!configData) {
      await supabase.from('config').insert({ key: 'capacity', value: '50' })
    }
  } catch (err) {
    console.error('[seedSupabase] Error inicializando datos:', err.message)
  }
}
