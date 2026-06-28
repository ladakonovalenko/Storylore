/**
 * graphHelpers.js
 *
 * Вся фронтенд-логіка для побудови графу зв'язків:
 *   • колір ребра залежно від strength
 *   • товщина ребра пропорційно до |strength|
 *   • фільтрація ребер для трьох режимів
 *   • перетворення даних API → елементи Cytoscape
 */

// ── Кольори (CSS-змінні з pallete проєкту) ───────────────────────────────────

export const EDGE_COLOR_POSITIVE = '#7F9C87' // moss-soft  — союзний (strength > 0)
export const EDGE_COLOR_NEGATIVE = '#C16B65' // crimson-soft — ворожий (strength < 0)
export const EDGE_COLOR_NEUTRAL  = '#3A3F54' // ink-500    — нейтральний (strength = 0 / null)
export const EDGE_COLOR_SECRET   = '#C98A3E' // amber-ink  — секретний режим

export const NODE_BG        = '#1F2230' // ink-700
export const NODE_BORDER    = '#565C77' // ink-300
export const NODE_SELECTED  = '#C98A3E' // amber-ink
export const NODE_LABEL     = '#E8E2D3' // parchment

// ── Товщина ребра ─────────────────────────────────────────────────────────────
// |strength| 0 → 1px, |strength| 10 → 10px
export function edgeWidth(strength) {
  const abs = Math.abs(Number(strength ?? 0))
  // Мінімум 1, максимум 10, лінійна шкала
  return Math.max(1, Math.min(10, abs === 0 ? 1 : abs))
}

// ── Колір ребра ───────────────────────────────────────────────────────────────
export function edgeColor(strength) {
  const n = Number(strength ?? 0)
  if (n > 0) return EDGE_COLOR_POSITIVE
  if (n < 0) return EDGE_COLOR_NEGATIVE
  return EDGE_COLOR_NEUTRAL
}

// ── Режими фільтрації ─────────────────────────────────────────────────────────

export const GRAPH_MODES = {
  ALL:       'all',
  CONFLICTS: 'conflicts',
  SECRETS:   'secrets',
}

// Типи зв'язків, які вважаються «ворожими» для карти конфліктів
const CONFLICT_TYPES = new Set(['enemy', 'rival'])

// Типи зв'язків, які вважаються «секретними» для карти секретів
const SECRET_TYPES = new Set(['knows_secret', 'secret'])

// Ключові слова для фільтра за описом (карта секретів)
const SECRET_KEYWORDS = ['секрет', 'таємниц', 'таємн', 'hidden', 'secret']

/**
 * Повертає true, якщо зв'язок відповідає режиму "Карта конфліктів":
 *   – тип є «ворожим» АБО strength від'ємний
 */
export function isConflict(rel) {
  return CONFLICT_TYPES.has(rel.type) || Number(rel.strength ?? 0) < 0
}

/**
 * Повертає true, якщо зв'язок відповідає режиму "Карта секретів":
 *   – тип є «секретним» АБО опис містить ключові слова
 */
export function isSecret(rel) {
  if (SECRET_TYPES.has(rel.type)) return true
  const desc = (rel.description || '').toLowerCase()
  return SECRET_KEYWORDS.some((kw) => desc.includes(kw))
}

/**
 * Фільтрує масив зв'язків за режимом.
 */
export function filterRelationships(relationships, mode) {
  if (mode === GRAPH_MODES.CONFLICTS) return relationships.filter(isConflict)
  if (mode === GRAPH_MODES.SECRETS)   return relationships.filter(isSecret)
  return relationships // ALL
}

// ── Перетворення в елементи Cytoscape ────────────────────────────────────────

/**
 * Будує масив елементів Cytoscape { data, classes } зі списків персонажів та зв'язків.
 *
 * @param {object[]} characters      – масив персонажів [{id, name, status, ...}]
 * @param {object[]} relationships   – відфільтрований масив зв'язків
 * @param {string}   mode            – поточний режим GRAPH_MODES.*
 * @returns {object[]}               – масив для cytoscape({ elements: [...] })
 */
export function buildElements(characters, relationships, mode) {
  // Які персонажі реально мають хоча б один зв'язок після фільтрації?
  const connectedIds = new Set()
  relationships.forEach((r) => {
    connectedIds.add(String(r.source_character_id))
    connectedIds.add(String(r.target_character_id))
  })

  // Вузли — всі персонажі (або лише підключені для чистоти карт)
  // В режимі ALL показуємо всіх, в інших — тільки задіяних
  const visibleChars = mode === GRAPH_MODES.ALL
    ? characters
    : characters.filter((c) => connectedIds.has(String(c.id)))

  const nodes = visibleChars.map((c) => ({
    data: {
      id:     String(c.id),
      label:  c.name || `#${c.id}`,
      status: c.status || 'unknown',
    },
  }))

  // Ребра
  const edges = relationships.map((r) => {
    const isSecretEdge = mode === GRAPH_MODES.SECRETS

    return {
      data: {
        id:       `e-${r.id}`,
        source:   String(r.source_character_id),
        target:   String(r.target_character_id),
        label:    r.type || '',
        strength: r.strength ?? 0,
        // Розраховані властивості для стилізації
        color:    isSecretEdge ? EDGE_COLOR_SECRET : edgeColor(r.strength),
        width:    edgeWidth(r.strength),
        dashed:   isSecretEdge, // пунктир для секретів
      },
    }
  })

  return [...nodes, ...edges]
}

// ── Стилі Cytoscape ──────────────────────────────────────────────────────────

/**
 * Повертає масив стилів для cytoscape({ style: [...] }).
 * Стилі mapped на data-поля, які ми прописали в buildElements.
 */
export function buildStylesheet(mode) {
  const isSecrets = mode === GRAPH_MODES.SECRETS

  return [
    // Вузли
    {
      selector: 'node',
      style: {
        'background-color':   NODE_BG,
        'border-color':       NODE_BORDER,
        'border-width':       2,
        'label':              'data(label)',
        'color':              NODE_LABEL,
        'font-size':          13,
        'font-family':        '"Inter", system-ui, sans-serif',
        'text-valign':        'center',
        'text-halign':        'center',
        'text-wrap':          'wrap',
        'text-max-width':     80,
        'width':              52,
        'height':             52,
        'shape':              'ellipse',
        'transition-property':'border-color, background-color',
        'transition-duration':'0.15s',
      },
    },
    // Виділений вузол
    {
      selector: 'node:selected',
      style: {
        'border-color':     NODE_SELECTED,
        'border-width':     3,
        'background-color': '#252838',
      },
    },
    // Вузол при наведенні
    {
      selector: 'node:active',
      style: { 'overlay-opacity': 0 },
    },
    // Статус персонажа — колір рамки
    {
      selector: 'node[status = "alive"]',
      style: { 'border-color': '#5E7A66' }, // moss-dim
    },
    {
      selector: 'node[status = "deceased"]',
      style: { 'border-color': '#9A4A45' }, // crimson-dim
    },

    // Ребра — базовий стиль
    {
      selector: 'edge',
      style: {
        'width':              'data(width)',
        'line-color':         'data(color)',
        'target-arrow-color': 'data(color)',
        'curve-style':        'bezier',
        'opacity':            0.85,
        // Стрілка для режиму секретів вмикається через клас
        'target-arrow-shape': isSecrets ? 'triangle' : 'none',
        'line-style':         'solid',
        'transition-property':'opacity',
        'transition-duration':'0.2s',
      },
    },
    // Пунктир для секретних ребер (клас dodane в buildElements через data.dashed)
    {
      selector: 'edge[?dashed]',
      style: {
        'line-style':         'dashed',
        'line-dash-pattern':  [8, 4],
        'target-arrow-shape': 'triangle',
      },
    },
    // Виділене ребро
    {
      selector: 'edge:selected',
      style: {
        'opacity':    1,
        'line-color': '#E0AD6E', // amber-soft
      },
    },
  ]
}
