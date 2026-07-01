import { normalizeFields } from './templateFields'

/**
 * Підраховує відсоток заповненості анкети персонажа.
 *
 * Базові текстові поля перевіряємо завжди.
 * Якщо є шаблон — рахуємо саме його поля (плюс базові).
 * Якщо шаблону немає (персонаж створений через "повну анкету") —
 * рахуємо ВСІ текстові поля моделі Character, інакше прогрес
 * враховує лише 5 базових полів і не бачить решту заповненого.
 *
 * @param {object} character - об'єкт персонажа
 * @param {object|null} templateDetail - повний об'єкт шаблону з API (або null)
 * @returns {{ filled: number, total: number, percent: number }}
 */
export function calcProgress(character, templateDetail) {
  if (!character) return { filled: 0, total: 0, percent: 0 }
  const TEXT_TYPES = new Set(['text', 'textarea', 'string', undefined, null, ''])

  // ВИПРАВЛЕНО: прибрано 'notes' — такого поля немає в моделі Character (models.py),
  // тому воно завжди було порожнім і штучно занижувало відсоток.
  const BASE_KEYS = new Set([
    'name', 'description', 'biography', 'appearance', 'motivation_goals',
  ])

  // НОВЕ: повний список текстових полів моделі Character — узгоджений
  // з ALL_FIELDS у CharacterForm.jsx та EXTRA_DETAIL_FIELDS у CharacterDetail.jsx.
  // Використовується, коли персонаж НЕ прив'язаний до шаблону (templateDetail === null),
  // інакше прогрес рахував лише 5 базових полів, ігноруючи решту заповненої анкети.
  const FULL_MODEL_KEYS = [
    ...BASE_KEYS,
    'character_traits', 'fears_vulnerabilities', 'values_beliefs', 'self_perception',
    'traumas', 'secrets', 'family_origin', 'social_status', 'character_arc',
    'unresolved_conflicts', 'skills', 'resources', 'physical_limitations',
    'psychological_limitations', 'habits_routines', 'reputation',
    'communication_style', 'allies_perception', 'enemies_perception',
    'contrasts', 'symbols',
  ]

  const entries = [] // { key, isText }

  if (templateDetail) {
    // Є шаблон — базові поля + поля шаблону
    for (const key of BASE_KEYS) entries.push({ key, isText: true })

    const fields = normalizeFields(templateDetail)
    for (const field of fields) {
      if (BASE_KEYS.has(field.key)) continue
      if (['id', 'template_key', 'project_id', 'created_at', 'updated_at'].includes(field.key)) continue
      const isText = TEXT_TYPES.has(field.type)
      if (isText) entries.push({ key: field.key, isText: true })
    }
  } else {
    // Немає шаблону ("повна анкета") — рахуємо всі текстові поля моделі
    for (const key of FULL_MODEL_KEYS) entries.push({ key, isText: true })
  }

  const total = entries.length
  if (total === 0) return { filled: 0, total: 0, percent: 0 }
  const filled = entries.filter(({ key }) => {
    const val = character[key]
    return val !== undefined && val !== null && String(val).trim() !== ''
  }).length
  return { filled, total, percent: Math.round((filled / total) * 100) }
}

/** Tailwind-клас кольору фону прогрес-бару */
export function progressBarColor(percent) {
  if (percent >= 80) return 'bg-moss-soft'
  if (percent >= 50) return 'bg-amber-ink'
  return 'bg-crimson-soft'
}
/** Tailwind-клас кольору тексту */
export function progressTextColor(percent) {
  if (percent >= 80) return 'text-moss-soft'
  if (percent >= 50) return 'text-amber-soft'
  return 'text-crimson-soft'
}

// НОВЕ: тематичні категорії для радар-діаграми "Баланс анкети".
// Поля description/appearance/main_location свідомо не включені —
// вони базові, а не "глибокі" риси персонажа.
export const CATEGORY_GROUPS = [
  { key: 'personality',   label: 'Особистість', fields: ['character_traits', 'values_beliefs', 'self_perception', 'contrasts'] },
  { key: 'psychology',    label: 'Психологія',   fields: ['fears_vulnerabilities', 'traumas', 'psychological_limitations', 'secrets'] },
  { key: 'relations',     label: 'Стосунки',     fields: ['relationships', 'allies_perception', 'enemies_perception', 'reputation', 'communication_style'] },
  { key: 'history',       label: 'Історія',      fields: ['biography', 'family_origin', 'social_status'] },
  { key: 'development',   label: 'Розвиток',     fields: ['motivation_goals', 'character_arc', 'unresolved_conflicts', 'symbols'] },
  { key: 'skills',        label: 'Навички',      fields: ['skills', 'resources', 'physical_limitations', 'habits_routines'] },
]

/**
 * Підраховує % заповненості персонажа по кожній тематичній категорії —
 * дані для радар-діаграми "Баланс анкети".
 * @param {object} character
 * @returns {{ key: string, label: string, percent: number }[]}
 */
export function calcCategoryBreakdown(character) {
  if (!character) return CATEGORY_GROUPS.map((g) => ({ key: g.key, label: g.label, percent: 0 }))

  return CATEGORY_GROUPS.map((group) => {
    const total = group.fields.length
    const filled = group.fields.filter((key) => {
      const val = character[key]
      return val !== undefined && val !== null && String(val).trim() !== ''
    }).length
    return { key: group.key, label: group.label, percent: Math.round((filled / total) * 100) }
  })
}
