export interface DeliveryDayOption {
  value: string;
  label: string;
  dayName: 'Miércoles' | 'Viernes';
}

export function getUpcomingDeliveryDates(count: number = 10): DeliveryDayOption[] {
  const options: DeliveryDayOption[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(today);
  let iterations = 0;
  
  while (options.length < count && iterations < 90) {
    iterations++;
    const day = current.getDay();
    if (day === 3 || day === 5) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const iso = y + '-' + m + '-' + d;
      const dayName: 'Miércoles' | 'Viernes' = day === 3 ? 'Miércoles' : 'Viernes';
      const formattedDate = d + '/' + m + '/' + y;
      
      options.push({
        value: iso,
        label: dayName + ' ' + formattedDate,
        dayName: dayName
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return options;
}

export function isWednesdayOrFriday(dateStr: string): boolean {
  if (!dateStr) return true;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return true;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const day = d.getDay();
  return day === 3 || day === 5;
}
