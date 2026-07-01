/**
 * Форматує рік події з урахуванням можливого від'ємного значення (до нашої ери).
 * Зберігаємо в БД звичайне число (від'ємне = до н.е.), а тут лише відображаємо його
 * людяно, замість сирого "-500".
 *
 *   formatYear(-500) -> "500 до н.е."
 *   formatYear(250)  -> "250 н.е."
 *   formatYear(0)    -> "0 р."
 */
export function formatYear(year) {
  if (year == null) return null
  if (year < 0) return `${Math.abs(year)} до н.е.`
  if (year === 0) return '0 р.'
  return `${year} н.е.`
}
