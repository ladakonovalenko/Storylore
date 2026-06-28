/**
 * Утиліти для роботи з шаблонами персонажів.
 * Бекенд тепер повертає об'єкти з полем `fields` — масивом TemplateField.
 */

export function getTemplateKey(template) {
  return template.template_key ?? template.key ?? template.id ?? template.name
}

export function getTemplateLabel(template) {
  return template.template_name ?? template.label ?? template.title ?? getTemplateKey(template)
}

export function getTemplateDescription(template) {
  return template.description ?? null
}

/**
 * Нормалізує список полів шаблону до єдиного формату.
 * Підтримує новий формат (масив об'єктів з fields)
 * і старий формат (плоский об'єкт без fields) для сумісності.
 */
export function normalizeFields(template) {
  // ✅ Новий формат: template.fields — масив об'єктів
  if (Array.isArray(template?.fields) && template.fields.length > 0) {
    return template.fields.map(normalizeOneField)
  }

  // Старий формат: плоский об'єкт (сумісність)
  const rawFields = template?.schema ?? template?.properties ?? []

  if (Array.isArray(rawFields)) {
    return rawFields.map(normalizeOneField)
  }

  if (rawFields && typeof rawFields === 'object') {
    return Object.entries(rawFields).map(([key, value]) =>
      normalizeOneField({ key, ...(typeof value === 'object' ? value : { type: value }) })
    )
  }

  return []
}

function normalizeOneField(field) {
  if (typeof field === 'string') {
    return {
      key: field, label: humanize(field), type: 'textarea',
      required: false, placeholder: null, hint: null, example: null,
    }
  }

  return {
    key:         field.key         ?? field.name ?? field.id ?? 'field',
    label:       field.label       ?? field.title ?? humanize(field.key ?? ''),
    type:        field.type        ?? field.field_type ?? 'textarea',
    required:    Boolean(field.required ?? field.is_required ?? false),
    placeholder: field.placeholder ?? null,
    hint:        field.hint        ?? field.helper_text ?? null,
    example:     field.example     ?? null,
  }
}

function humanize(key) {
  return String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Повертає дефолтні значення полів шаблону для заповнення форми.
 */
export function getTemplateDefaults(template) {
  return template?.default_values ?? {}
}

/**
 * Заповнює форму прикладами з шаблону (кнопка "Згенерувати приклад").
 */
export function generateExampleValues(template) {
  const fields = normalizeFields(template)
  const result = { ...getTemplateDefaults(template) }
  for (const field of fields) {
    if (field.example) {
      result[field.key] = field.example
    }
  }
  return result
}
