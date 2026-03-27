export const calculateParkingPrice = (vehicleType, entryTime, exitTime, rates, serviceType = 'Diario') => {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = exit - entry;
  const diffHrs = diffMs / (1000 * 60 * 60);

  const rate = rates.find(r => r.id === vehicleType.toLowerCase()) || rates[0];

  if (serviceType === 'Semanal') {
    const weeks = Math.ceil(diffHrs / (24 * 7)) || 1;
    return weeks * (rate.price24h * 5); // Example weekly discount
  }

  if (serviceType === 'Mensual') {
    const months = Math.ceil(diffHrs / (24 * 30)) || 1;
    return months * (rate.price24h * 15); // Example monthly discount
  }

  if (diffHrs <= 0) return 0;

  const entryHour = entry.getHours();
  const exitHour = exit.getHours();
  const isDaySlot = diffHrs <= 12 && entryHour >= 6 && exitHour <= 18 && entry.getDate() === exit.getDate();

  if (isDaySlot) return rate.price6to6;
  if (diffHrs <= 12) return rate.price12h;
  if (diffHrs <= 24) return rate.price24h;

  const days = Math.floor(diffHrs / 24);
  const remainder = diffHrs % 24;
  let totalPrice = days * rate.price24h;

  if (remainder > 0 && remainder <= 12) {
    totalPrice += rate.price12h;
  } else if (remainder > 12) {
    totalPrice += rate.price24h;
  }

  return totalPrice;
};

export const getNextPaymentDate = (entryTime, serviceType) => {
  const date = new Date(entryTime);
  if (serviceType === 'Semanal') date.setDate(date.getDate() + 7);
  if (serviceType === 'Mensual') date.setDate(date.getDate() + 30);
  return serviceType === 'Diario' ? null : date.getTime();
};
