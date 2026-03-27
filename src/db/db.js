import Dexie from 'dexie'

/**
 * Dexie se mantiene ÚNICAMENTE para almacenar fotos de vehículos (base64).
 * Todos los demás datos operativos van a Supabase.
 */
const localDb = new Dexie('RyerParkingPhotos')
localDb.version(1).stores({
  photos: 'ticketNumber',
})

/**
 * Guarda las 4 fotos de un vehículo asociadas a un número de ticket.
 * @param {string} ticketNumber
 * @param {{ front, back, left, right }} photos - base64 data URLs
 */
export const savePhotos = (ticketNumber, photos) =>
  localDb.photos.put({ ticketNumber, ...photos })

/**
 * Recupera las fotos de un vehículo por su número de ticket.
 * Retorna objeto con claves front/back/left/right (null si no existen).
 */
export const getPhotos = async (ticketNumber) => {
  const record = await localDb.photos.get(ticketNumber)
  return record ?? { front: null, back: null, left: null, right: null }
}
