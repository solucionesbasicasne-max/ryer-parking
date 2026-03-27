import Dexie from 'dexie';

export const db = new Dexie('RyerParkingDB');

db.version(2).stores({
  clients: '++id, name, phone, email',
  vehicles: '++id, plate, brand, model, clientId',
  entries: '++id, ticketNumber, plate, entryTime, exitTime, status, total, vehicleType, serviceType, nextPaymentDate, clientId',
  sessions: '++id, openTime, closeTime, initialBalance, finalBalance, status',
  rates: 'id, type, price6to6, price12h, price24h, isActive',
  users: '++id, username, password, role',
  config: 'id, key, value'
}).upgrade(tx => {
  // Logic for upgrading from v1 to v2 if needed
});

export const seedDatabase = async () => {
  // Rates
  const ratesCount = await db.rates.count();
  if (ratesCount === 0) {
    await db.rates.bulkAdd([
      { id: 'cars', type: 'Cars', price6to6: 20, price12h: 25, price24h: 30, isActive: true },
      { id: 'minivan', type: 'Minivan', price6to6: 25, price12h: 30, price24h: 35, isActive: true },
      { id: 'luxury', type: 'Luxury Cars', price6to6: 25, price12h: 30, price24h: 35, isActive: true },
      { id: 'vans', type: 'Vans', price6to6: 30, price12h: 35, price24h: 40, isActive: true },
    ]);
  }

  // Users
  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.add({ username: 'admin', password: 'admin123', role: 'Admin' });
    await db.users.add({ username: 'operator', password: 'op123', role: 'Operator' });
  }

  // Config
  const configExists = await db.config.get('capacity');
  if (!configExists) {
    await db.config.add({ id: 'capacity', value: 50 });
  }
};
