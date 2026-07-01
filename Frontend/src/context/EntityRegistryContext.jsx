import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useProject } from './ProjectContext'
import { getCharacters } from '../api/characters'
import { getProjectFactions } from '../api/factions'
import { getProjectLocations } from '../api/locations'
import { getProjectWikiArticles } from '../api/wiki'
import { getProjectCustomPages } from '../api/customPages'

const EntityRegistryContext = createContext(null)

export function EntityRegistryProvider({ children }) {
  const { activeProjectId } = useProject()
  // НОВЕ: customPages додано до реєстру
  const [entities, setEntities] = useState({ characters: [], factions: [], locations: [], wikiArticles: [], customPages: [] })

  const load = useCallback(async () => {
    if (!activeProjectId) {
      setEntities({ characters: [], factions: [], locations: [], wikiArticles: [], customPages: [] })
      return
    }
    try {
      const [characters, factions, locations, wikiArticles, customPages] = await Promise.all([
        getCharacters(activeProjectId),
        getProjectFactions(activeProjectId),
        getProjectLocations(activeProjectId),
        getProjectWikiArticles(activeProjectId),
        getProjectCustomPages(activeProjectId),
      ])
      setEntities({ characters, factions, locations, wikiArticles, customPages })
    } catch {
      // тихо ігноруємо — посилання просто не резолвляться, без помилки на сторінці
    }
  }, [activeProjectId])

  useEffect(() => { load() }, [load])

  // Пошук сутності за точною назвою (без урахування регістру) серед усіх типів —
  // саме цю функцію використовує LinkedText/FormattedText для розпізнавання [[Назва]]
  const resolveLink = useCallback((rawName) => {
    const name = rawName.trim().toLowerCase()
    if (!name) return null

    const char = entities.characters.find((c) => c.name?.toLowerCase() === name)
    if (char) return { type: 'character', id: char.id, label: char.name, path: '/characters' }

    const loc = entities.locations.find((l) => l.name?.toLowerCase() === name)
    if (loc) return { type: 'location', id: loc.id, label: loc.name, path: '/world-map' }

    const fac = entities.factions.find((f) => f.name?.toLowerCase() === name)
    if (fac) return { type: 'faction', id: fac.id, label: fac.name, path: '/factions' }

    const wiki = entities.wikiArticles.find((w) => w.title?.toLowerCase() === name)
    if (wiki) return { type: 'wiki', id: wiki.id, label: wiki.title, path: '/wiki' }

    // НОВЕ: власні сторінки — маршрут інший (/page/:id, прямий перехід без ?focus=,
    // бо CustomPageDetail бере id з параметра шляху, а не з query)
    const page = entities.customPages.find((p) => p.title?.toLowerCase() === name)
    if (page) return { type: 'custom_page', id: page.id, label: page.title, path: `/page/${page.id}`, noFocusParam: true }

    return null
  }, [entities])

  return (
    <EntityRegistryContext.Provider value={{ entities, resolveLink, refresh: load }}>
      {children}
    </EntityRegistryContext.Provider>
  )
}

export function useEntityRegistry() {
  const ctx = useContext(EntityRegistryContext)
  if (!ctx) throw new Error('useEntityRegistry має використовуватися всередині <EntityRegistryProvider>')
  return ctx
}
