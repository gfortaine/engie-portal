export function formatCurrency(amount: number, locale = 'fr-FR', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date, locale = 'fr-FR'): string {
  return new Date(date).toLocaleDateString(locale);
}

export function formatEnergy(value: number, unit: 'kWh' | 'm³', locale = 'fr-FR'): string {
  return `${value.toLocaleString(locale)} ${unit}`;
}

export function classNames(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
