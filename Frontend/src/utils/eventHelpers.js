/**
 * Події фентезійного світу рідко мають реальні ISO-дати — частіше це
 * "Третій рік Великої Війни" чи просто номер дня в історії. Тому подія
 * має довільну текстову дату для показу (date_label) та числовий
 * sort_order для впорядкування — обидва поля суто клієнтська умовність,
 * узгоджена з формою створення події.
 */

export function sortEventsChronologically(events) {
  return [...events].sort((a, b) => {
    const orderA = Number(a.sort_order ?? a.order ?? 0)
    const orderB = Number(b.sort_order ?? b.order ?? 0)
    return orderA - orderB
  })
}

export function getEventTitle(event) {
  return event.title || event.name || 'Подія без назви'
}

export function getEventDateLabel(event) {
  return event.date_label || event.date || event.timestamp || null
}
