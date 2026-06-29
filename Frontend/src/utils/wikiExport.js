const TYPE_LABEL = { character: 'Персонаж', faction: 'Фракція', location: 'Локація' }

function resolveEntityName(link, characters, factions, locations) {
  const list = link.entity_type === 'character' ? characters
    : link.entity_type === 'faction' ? factions
    : locations
  const item = list.find((i) => i.id === link.entity_id)
  return item?.name || item?.title || `#${link.entity_id}`
}

// Markdown для однієї статті (кнопка "Завантажити" в деталях статті)
export function buildArticleMarkdown(article, characters = [], factions = [], locations = []) {
  let md = `# ${article.title}\n\n`
  md += `_Категорія: ${article.category}_\n\n`
  md += `${article.content?.trim() || '_Без тексту_'}\n`

  if (article.links?.length > 0) {
    md += `\n## Пов'язані сутності\n\n`
    article.links.forEach((l) => {
      md += `- ${TYPE_LABEL[l.entity_type] ?? l.entity_type}: ${resolveEntityName(l, characters, factions, locations)}\n`
    })
  }
  return md
}

// Markdown для всієї бібліотеки проєкту одразу, згрупований за категоріями
export function buildLibraryMarkdown(articles, characters = [], factions = [], locations = [], projectTitle = '') {
  let md = `# Бібліотека світу${projectTitle ? `: ${projectTitle}` : ''}\n\n`

  const byCategory = {}
  articles.forEach((a) => {
    byCategory[a.category] = byCategory[a.category] || []
    byCategory[a.category].push(a)
  })

  Object.entries(byCategory).forEach(([category, items]) => {
    md += `## ${category}\n\n`
    items.forEach((a) => {
      md += `### ${a.title}\n\n${a.content?.trim() || '_Без тексту_'}\n\n`
      if (a.links?.length > 0) {
        const names = a.links.map((l) => resolveEntityName(l, characters, factions, locations))
        md += `**Пов'язані сутності:** ${names.join(', ')}\n\n`
      }
    })
  })

  return md
}
