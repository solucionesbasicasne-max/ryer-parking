import { supabase, supaQuery } from '../lib/supabaseClient'

/** Retorna todos los usuarios (sin exponer contraseña en el listado) */
export const getUsers = () =>
  supaQuery(supabase.from('users').select('id, username, role').order('username'))

/**
 * Autentica a un usuario por username y password.
 * Retorna el objeto del usuario (sin contraseña) o null si las credenciales son incorrectas.
 */
export const loginUser = async (username, password) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, password')
    .eq('username', username)
    .single()

  if (error || !data) return null
  if (data.password !== password) return null // TODO: bcrypt comparison en producción
  return { id: data.id, username: data.username, role: data.role }
}

/** Crea un usuario nuevo */
export const createUser = (data) =>
  supaQuery(supabase.from('users').insert(data).select('id, username, role').single())

/** Actualiza username, password o role de un usuario */
export const updateUser = async (id, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, username, role')
    .single()
  if (error) throw new Error(error.message)
  return data
}

/** Elimina un usuario por id */
export const deleteUser = (id) =>
  supaQuery(supabase.from('users').delete().eq('id', id))
