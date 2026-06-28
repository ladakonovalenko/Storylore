import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Waypoints, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

import { getRelationships } from '../api/relationships'
import { getCharacters }    from '../api/characters'
import { GRAPH_MODES, filterRelationships } from '../utils/graphHelpers'

import CharacterGraph from '../components/graph/CharacterGraph'
import GraphLegend    from '../components/graph/GraphLegend'
import GraphTooltip   from '../components/graph/GraphTooltip'
import InkStroke      from '../components/layout/InkStroke'

// ── Конфігурація режимів ───────────────────────────────────────────────────

const MODES = [
  {
    key:   GRAPH_MODES.ALL,
    label: 'Всі зв\'язки',
    desc:  'Повна карта — всі персонажі та зв\'язки між ними.',
  },
  {
    key:   GRAPH_MODES.CONFLICTS,
    label: '⚔️ Карта конфліктів',
    desc:  'Лише ворожі зв\'язки: типи «ворог», «суперник» або від\'ємна сила.',
  },
  {
    key:   GRAPH_MODES.SECRETS,
    label: '🤫 Карта секретів',
    desc:  'Лише таємні зв\'язки: «знає секрет», «таємний» або ключові слова в описі.',
  },
]

// ── Головна сторінка ──────────────────────────────────────────────────────────

export default function GraphPage() {
  const [characters,     setCharacters]     = useState([])
  const [relationships,  setRelationships]  = useState([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [error,          setError]          = useState(null)

  const [mode,           setMode]           = useState(GRAPH_MODES.ALL)
  const [tooltipInfo,    setTooltipInfo]    = useState(null)  // { type, data }

  // ── Завантаження ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const [chars, rels] = await Promise.all([getCharacters(), getRelationships()])
      setCharacters(chars)
      setRelationships(rels)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Фільтрація зв'язків за режимом (суто фронтенд) ───────────────────────
  const filteredRelationships = useMemo(
    () => filterRelationships(relationships, mode),
    [relationships, mode]
  )

  const activeMode = MODES.find((m) => m.key === mode)

  // Кількість ребер у поточному режимі
  const edgeCount = filteredRelationships.length
  const nodeCount = mode === GRAPH_MODES.ALL
    ? characters.length
    : (() => {
        const ids = new Set()
        filteredRelationships.forEach((r) => {
          ids.add(String(r.source_character_id))
          ids.add(String(r.target_character_id))
        })
        return ids.size
      })()

  // ── Рендер ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-0 -mx-8 -my-6">

      {/* ── Верхня панель управління ── */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-ink-500 bg-ink-900 px-8 py-4">

        {/* Заголовок + рефреш */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium text-parchment">Мапа світу</h2>
            <InkStroke className="mt-0.5" width={80} />
          </div>
          <button
            onClick={load}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-md border border-ink-500 px-3 py-1.5 text-xs text-parchment-dim hover:border-ink-300 hover:text-parchment disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>

        {/* Перемикач режимів */}
        <div className="flex flex-wrap items-center gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setTooltipInfo(null) }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === m.key
                  ? 'bg-amber-ink text-ink-900'
                  : 'bg-ink-700 text-parchment-dim hover:bg-ink-500 hover:text-parchment'
              }`}
            >
              {m.label}
            </button>
          ))}

          {/* Статистика */}
          {!isLoading && (
            <span className="ml-2 text-xs text-parchment-dim">
              {nodeCount} персонаж{nodeCount === 1 ? '' : 'ів'} · {edgeCount} зв'язк{edgeCount === 1 ? '' : edgeCount < 5 ? 'и' : 'ів'}
            </span>
          )}
        </div>

        {/* Опис режиму */}
        {activeMode && (
          <p className="text-xs text-parchment-dim/80">{activeMode.desc}</p>
        )}
      </div>

      {/* ── Основна область ── */}
      <div className="relative flex flex-1 overflow-hidden">

        {/* Граф */}
        <div className="relative flex-1">
          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-3 text-parchment-dim">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Будуємо граф…</span>
            </div>

          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <p className="text-sm text-crimson-soft">{error}</p>
              <button onClick={load}
                className="rounded-md border border-ink-500 px-4 py-2 text-sm text-parchment-dim hover:border-ink-300">
                Спробувати знову
              </button>
            </div>

          ) : characters.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Waypoints size={32} strokeWidth={1.5} className="text-parchment-dim" />
              <h3 className="font-display text-xl text-parchment">Немає персонажів</h3>
              <p className="max-w-xs text-sm text-parchment-dim">
                Спочатку створіть персонажів і зв'язки між ними.
              </p>
            </div>

          ) : edgeCount === 0 && mode !== GRAPH_MODES.ALL ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Waypoints size={32} strokeWidth={1.5} className="text-parchment-dim" />
              <h3 className="font-display text-xl text-parchment">Нічого не знайдено</h3>
              <p className="max-w-xs text-sm text-parchment-dim">
                {mode === GRAPH_MODES.CONFLICTS
                  ? 'Немає ворожих зв\'язків або зв\'язків з від\'ємною силою.'
                  : 'Немає таємних зв\'язків або зв\'язків з відповідним описом.'}
              </p>
              <button
                onClick={() => setMode(GRAPH_MODES.ALL)}
                className="mt-2 rounded-full bg-ink-700 px-4 py-1.5 text-sm text-parchment-dim hover:bg-ink-500"
              >
                Показати всі зв'язки
              </button>
            </div>

          ) : (
            <CharacterGraph
              key={`${mode}-${characters.length}-${filteredRelationships.length}`}
              characters={characters}
              relationships={filteredRelationships}
              mode={mode}
              onNodeClick={(data) => setTooltipInfo({ type: 'node', data })}
              onEdgeClick={(data) => setTooltipInfo({ type: 'edge', data })}
              onBgClick={() => setTooltipInfo(null)}
            />
          )}

          {/* Tooltip при кліку */}
          <GraphTooltip
            info={tooltipInfo}
            onClose={() => setTooltipInfo(null)}
          />

          {/* Підказка по навігації */}
          {!isLoading && !error && characters.length > 0 && (
            <div className="absolute bottom-4 right-4 text-xs text-parchment-dim/50 text-right pointer-events-none">
              <p>Scroll — zoom · Drag — pan</p>
              <p>Click — деталі</p>
            </div>
          )}
        </div>

        {/* ── Права панель: легенда ── */}
        {!isLoading && !error && characters.length > 0 && (
          <aside className="w-52 shrink-0 overflow-y-auto border-l border-ink-500 bg-ink-800 p-4">
            <GraphLegend mode={mode} />

            {/* Статистика за режимом */}
            <div className="mt-4 rounded-md border border-ink-500 bg-ink-900 px-3 py-3 text-xs text-parchment-dim">
              <p className="mb-2 font-medium uppercase tracking-wider text-parchment-dim/70">
                Статистика
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Персонажів</span>
                  <span className="text-parchment font-medium">{nodeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Зв'язків</span>
                  <span className="text-parchment font-medium">{edgeCount}</span>
                </div>
                {mode !== GRAPH_MODES.ALL && (
                  <div className="flex justify-between mt-1 pt-1 border-t border-ink-500">
                    <span>Всього зв'язків</span>
                    <span className="text-parchment-dim">{relationships.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Підказки для режимів */}
            {mode === GRAPH_MODES.SECRETS && (
              <div className="mt-3 rounded-md border border-amber-ink/30 bg-amber-ink/5 px-3 py-2 text-xs text-parchment-dim">
                <p className="font-medium text-amber-soft mb-1">Карта секретів</p>
                <p className="leading-snug">
                  Стрілка вказує напрямок: хто знає чий секрет.
                </p>
              </div>
            )}
            {mode === GRAPH_MODES.CONFLICTS && (
              <div className="mt-3 rounded-md border border-crimson-dim/30 bg-crimson-dim/5 px-3 py-2 text-xs text-parchment-dim">
                <p className="font-medium text-crimson-soft mb-1">Карта конфліктів</p>
                <p className="leading-snug">
                  Показані лише лінії напруги між персонажами.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
