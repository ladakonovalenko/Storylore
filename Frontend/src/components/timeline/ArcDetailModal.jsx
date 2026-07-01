import { Plus, Users } from 'lucide-react'
import Modal from '../common/Modal'
import EventCard from './EventCard'

export default function ArcDetailModal({
  isOpen, onClose, arc, events, characters, eras, arcs, branches,
  onEditEvent, onDeleteEvent, onAddEvent,
}) {
  if (!arc) return null

  const arcEvents = events
    .filter((e) => e.arc_id === arc.id)
    .sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity))

  return (
    <Modal title={arc.title} isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-sky-400/15 px-2.5 py-0.5 text-xs text-sky-300">{arc.status}</span>
          {arc.genre && <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-parchment-dim">{arc.genre}</span>}
        </div>

        {arc.description && <p className="text-sm text-parchment-dim">{arc.description}</p>}
        {arc.goal && (
          <p className="text-sm text-parchment-dim">
            <span className="text-parchment-dim/60">Мета: </span>{arc.goal}
          </p>
        )}

        {arc.character_roles?.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
              <Users size={12} /> Учасники арки
            </p>
            <div className="flex flex-wrap gap-1.5">
              {arc.character_roles.map((r) => (
                <span key={r.id} className="rounded-full bg-ink-700 px-2.5 py-1 text-xs text-parchment-dim">
                  {r.character?.name ?? '?'} <span className="text-parchment-dim/50">· {r.role}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-ink-500 pt-3">
          <p className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Події цієї арки ({arcEvents.length})
          </p>
          <button
            onClick={onAddEvent}
            className="flex items-center gap-1.5 rounded-md bg-amber-ink px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-amber-soft"
          >
            <Plus size={13} /> Додати подію
          </button>
        </div>

        {arcEvents.length === 0 ? (
          <p className="text-sm italic text-parchment-dim/60">У цій арці ще немає подій.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {arcEvents.map((ev) => (
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
