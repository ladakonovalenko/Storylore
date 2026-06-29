// Універсальний мультивибір сутностей трьох типів для прив'язки до статті бібліотеки.
// value: [{ entity_type, entity_id }]
export default function LinkedEntitiesPicker({ characters = [], factions = [], locations = [], value, onChange }) {
  const isSelected = (type, id) => value.some((v) => v.entity_type === type && v.entity_id === id)

  const toggle = (type, id) => {
    if (isSelected(type, id)) {
      onChange(value.filter((v) => !(v.entity_type === type && v.entity_id === id)))
    } else {
      onChange([...value, { entity_type: type, entity_id: id }])
    }
  }

  const groups = [
    { type: 'character', label: 'Персонажі', items: characters },
    { type: 'faction', label: 'Фракції', items: factions },
    { type: 'location', label: 'Локації', items: locations },
  ].filter((g) => g.items.length > 0)

  if (groups.length === 0) {
    return <p className="text-xs italic text-parchment-dim/60">У проєкті ще немає персонажів, фракцій чи локацій для прив'язки</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.type}>
          <span className="text-xs text-parchment-dim">{group.label}</span>
          <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-ink-500 bg-ink-900 p-2">
            {group.items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-parchment hover:bg-ink-700"
              >
                <input
                  type="checkbox"
                  checked={isSelected(group.type, item.id)}
                  onChange={() => toggle(group.type, item.id)}
                  className="accent-amber-ink"
                />
                <span className="flex-1 truncate">{item.name || item.title}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
