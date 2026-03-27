import { supabase, supaQuery } from '../lib/supabaseClient'

// ── CRUD básico ───────────────────────────────────────────────────

/** Obtiene todos los clientes ordenados por nombre */
export const getClients = () =>
  supaQuery(supabase.from('clients').select('*').order('name'))

/** Busca clientes por nombre o teléfono (para autocomplete) */
export const searchClients = async (term) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
    .limit(5)
  if (error) throw new Error(error.message)
  return data
}

/** Crea un cliente nuevo y retorna el objeto insertado */
export const createClient = (data) =>
  supaQuery(supabase.from('clients').insert(data).select().single())

/** Actualiza campos de un cliente por id */
export const updateClient = (id, data) =>
  supaQuery(supabase.from('clients').update(data).eq('id', id).select().single())

/** Elimina un cliente por id */
export const deleteClient = (id) =>
  supaQuery(supabase.from('clients').delete().eq('id', id))

/** Verifica si ya existe un cliente con ese teléfono */
export const clientExistsByPhone = async (phone) => {
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()
  return data || null
}

// ── Realtime ─────────────────────────────────────────────────────

/**
 * Suscripción en tiempo real.
 * Ejecuta callback(listaActualizada) cada vez que hay cambios en `clients`.
 * Retorna función de limpieza para cancelar la suscripción.
 */
export const subscribeClients = (callback) => {
  const channel = supabase
    .channel('public:clients')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients' },
      async () => {
        try {
          const clients = await getClients()
          callback(clients)
        } catch (err) {
          console.error('[subscribeClients] Error refrescando clientes:', err.message)
        }
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
