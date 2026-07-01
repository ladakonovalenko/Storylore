import { Plus, GitBranch } from 'lucide-react'
import Modal from '../common/Modal'
import EventCard from './EventCard'

export default function BranchDetailModal({
  isOpen, onClose, branch, events, characters, eras, arcs, branches,
  onEditEvent, onDeleteEvent, onAddEvent,
}) {
  if (!branch) return null

  const branchEvents = events
    .filter((e) => e.branch_id === branch.id)
    .sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity))

  const branchPoint = events.find((e) => e.id === branch.branch_point_event_id)

  return (
    <Modal title={branch.name} isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        {branchPoint && (
          <p className="flex items-center gap-1.5 text-sm text-parchment-dim">
            <GitBranch size={13} className="text-crimson-soft" />
            Точка розгалуження: <span className="text-parchment">{branchPoint.title}</span>
          </p>
        )}
        {branch.description && <p className="text-sm text-parchment-dim">{branch.description}</p>}

        <div className="flex items-center justify-between border-t border-ink-500 pt-3">
          <p className="text-xs font-medium uppercase tracking-widest text-parchment-dim/70">
            Події цієї гілки ({branchEvents.length})
          </p>
          <button
            onClick={onAddEvent}
            className="flex items-center gap-1.5 rounded-md bg-amber-ink px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-amber-soft"
          >
            <Plus size={13} /> Додати подію
          </button>
        </div>

        {branchEvents.length === 0 ? (
          <p className="text-sm italic text-parchment-dim/60">У цій гілці ще немає подій.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {branchEvents.map((ev) => (
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
