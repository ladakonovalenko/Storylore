import { useEffect, useRef, useCallback } from 'react'
import cytoscape from 'cytoscape'
import { buildElements, buildStylesheet } from '../../utils/graphHelpers'

/**
 * Cytoscape-граф персонажів.
 *
 * Props:
 *   characters    {array}   — список персонажів
 *   relationships {array}   — вже відфільтровані зв'язки (залежно від mode)
 *   mode          {string}  — GRAPH_MODES.ALL | CONFLICTS | SECRETS
 *   onNodeClick   {fn}      — (nodeData) => void
 *   onEdgeClick   {fn}      — (edgeData) => void
 *   onBgClick     {fn}      — () => void  (клік на фон — скидаємо tooltip)
 */
export default function CharacterGraph({
  characters,
  relationships,
  mode,
  onNodeClick,
  onEdgeClick,
  onBgClick,
}) {
  const containerRef = useRef(null)
  const cyRef        = useRef(null)

  // ── Ініціалізація ──────────────────────────────────────────────────────────
  const initCy = useCallback(() => {
    if (!containerRef.current) return
    if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null }

    const elements  = buildElements(characters, relationships, mode)
    const stylesheet = buildStylesheet(mode)

    const cy = cytoscape({
      container:  containerRef.current,
      elements,
      style:      stylesheet,
      layout: {
        name:             'cose',          // органічне розташування
        idealEdgeLength:  160,
        nodeOverlap:      20,
        refresh:          20,
        fit:              true,
        padding:          48,
        randomize:        false,
        componentSpacing: 100,
        nodeRepulsion:    400000,
        edgeElasticity:   100,
        nestingFactor:    5,
        gravity:          80,
        numIter:          1000,
        animate:          true,
        animationDuration:600,
        coolingFactor:    0.95,
        minTemp:          1.0,
      },
      // Взаємодія
      zoomingEnabled:       true,
      userZoomingEnabled:   true,
      panningEnabled:       true,
      userPanningEnabled:   true,
      boxSelectionEnabled:  false,
      selectionType:        'single',
      // Обмеження зуму
      minZoom: 0.1,
      maxZoom: 4,
      // Відключаємо контекстне меню браузера
      wheelSensitivity: 0.3,
    })

    // ── Обробники кліків ──
    cy.on('tap', 'node', (e) => {
      onNodeClick?.(e.target.data())
    })
    cy.on('tap', 'edge', (e) => {
      onEdgeClick?.(e.target.data())
    })
    cy.on('tap', (e) => {
      if (e.target === cy) onBgClick?.()
    })

    // Hover — змінюємо курсор
    cy.on('mouseover', 'node, edge', () => {
      containerRef.current.style.cursor = 'pointer'
    })
    cy.on('mouseout', 'node, edge', () => {
      containerRef.current.style.cursor = 'default'
    })

    cyRef.current = cy
  }, [characters, relationships, mode, onNodeClick, onEdgeClick, onBgClick])

  useEffect(() => {
    initCy()
    return () => {
      if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null }
    }
  }, [initCy])

  // ── ResizeObserver: граф заповнює контейнер ───────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      cyRef.current?.resize()
      cyRef.current?.fit(undefined, 48)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: 'var(--ink-900)' }}
    />
  )
}
