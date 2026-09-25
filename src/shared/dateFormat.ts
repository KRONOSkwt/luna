/**
 * 'YYYY-MM-DD' → 'DD.MM.YYYY'.
 * Pure string ops only — calendar nights never pass through JS Date,
 * avoiding any timezone/day-boundary drift on the emotionally critical dates.
 */
export function formatDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}