import { Plus, Calendar } from 'lucide-react'
import Modal from '../common/Modal'
import EventCard from './EventCard'
import { formatYear } from '../../utils/yearLabel'

export default function EraDetailModal({
  isOpen, onClose, era, events, characters, eras, arcs, branches,
  onEditEvent, onDeleteEvent, onAddEvent,
}) {
  if (!era) return null

  const eraEvents = events
    .filter((e) => e.era_id === era.id)
    .sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity))

  return (
    <Modal title={era.name} isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        {(era.start_year != null || era.end_year != null) && (
          <p className="flex items-center gap-1.5 text-sm text-parchment-dim">
            <Calendar size={13} />
            {era.start_year != null ? formatYear(era.start_year) : '…'}
            {' — '}
            {era.end_year != null ? formatYear(era.end_year) : '…'}
          </p>
        )}
        {era.description && <p className="text-sm text-parchment-dim">{era.description}</p>}

        <div className="flex items-center justify-between border-t border-ink-500 pt-3">
          <p className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Події цієї ери ({eraEvents.length})
          </p>
          <button
            onClick={onAddEvent}
            className="flex items-center gap-1.5 rounded-md bg-amber-ink px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-amber-soft"
          >
            <Plus size={13} /> Додати подію
          </button>
        </div>

        {eraEvents.length === 0 ? (
          <p className="text-sm italic text-parchment-dim/60">У цій ері ще немає подій.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {eraEvents.map((ev) => (
              <EventCard
                key={ev.id} event={ev} characters={characters}
                eras={eras} arcs={arcs} branches={branches}
                onEdit={onEditEvent} onDelete={onDeleteEvent}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
