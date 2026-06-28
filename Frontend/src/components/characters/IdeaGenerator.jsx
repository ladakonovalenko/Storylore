import { useState } from 'react'
import { Sparkles, RefreshCw, Swords, Eye, Zap } from 'lucide-react'
import Modal from '../common/Modal'

// Словники-заготовки для генератора
const CONFLICT_TYPES = [
  'суперництво через спадок',
  'давня образа, про яку один з них не пам\u2019ятає',
  'розбіжність у цінностях щодо влади',
  'таємна прихильність, що переросла у заздрість',
  'борг, який неможливо повернути',
  'зрада в минулому, що досі не розкрита',
  'конкуренція за визнання наставника',
  'різні погляди на те, як досягти спільної мети',
  'один врятував іншого, і тепер відчуває за це образу',
  'політичні інтереси їхніх фракцій зіткнулися',
  'суперечка щодо того, хто насправді винен у минулій трагедії',
]

const SECRET_TEMPLATES = [
  '{name} приховує зв\u2019язок із ворогом фракції.',
  '{name} колись зрадив(ла) близького союзника і досі носить це у таємниці.',
  '{name} має вразливість, про яку ніхто не знає.',
  '{name} насправді не той/та, за кого себе видає.',
  '{name} відповідальний(а) за подію, наслідки якої досі відчуваються.',
  '{name} веде таємне листування з ворогом.',
  '{name} боїться, що його/її минуле буде розкрите.',
  '{name} переховує когось важливого.',
  '{name} знає правду про чиюсь смерть, але мовчить.',
  '{name} має таємну мету, що суперечить цілям фракції.',
]

const COMPLICATIONS = [
  'Несподіваний союзник виявляється шпигуном.',
  'Ресурс, на який усі покладались, виявляється підробкою.',
  'Старе пророцтво починає здійснюватися неочікуваним чином.',
  'Природна катастрофа змінює баланс сил між фракціями.',
  'З\u2019являється третя сторона з власними прихованими цілями.',
  'Документ, який мав усе пояснити, виявляється фальшивим.',
  'Союз, що здавався міцним, тріщить через дрібну образу.',
  'Минуле одного з персонажів несподівано впливає на теперішнє.',
  'Те, що вважалося перемогою, насправді обертається пасткою.',
  'З\u2019являється свідок, який бачив те, що мало лишитися таємницею.',
]

const TYPE_META = {
  conflict:     { label: 'Конфлікт',            icon: Swords },
  secret:       { label: 'Таємниця',            icon: Eye },
  complication: { label: 'Ускладнення сюжету',  icon: Zap },
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

function pickTwoDistinct(arr) {
  const a = pickRandom(arr)
  let b = pickRandom(arr)
  while (b.id === a.id && arr.length > 1) b = pickRandom(arr)
  return [a, b]
}

function generateIdea(characters) {
  const availableTypes = ['complication']
  if (characters.length >= 1) availableTypes.push('secret')
  if (characters.length >= 2) availableTypes.push('conflict')

  const type = pickRandom(availableTypes)

  if (type === 'conflict') {
    const [a, b] = pickTwoDistinct(characters)
    const reason = pickRandom(CONFLICT_TYPES)
    return { type, text: `${a.name} та ${b.name}: ${reason}.` }
  }
  if (type === 'secret') {
    const c = pickRandom(characters)
    const template = pickRandom(SECRET_TEMPLATES)
    return { type, text: template.replace('{name}', c.name) }
  }
  return { type: 'complication', text: pickRandom(COMPLICATIONS) }
}

export default function IdeaGenerator({ characters = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [idea, setIdea] = useState(null)

  const reroll = () => setIdea(generateIdea(characters))
  const handleOpen = () => { reroll(); setIsOpen(true) }

  const meta = idea ? TYPE_META[idea.type] : null
  const Icon = meta?.icon

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-md border border-ink-500 px-4 py-2 text-sm text-parchment hover:border-amber-ink hover:text-amber-soft"
      >
        <Sparkles size={16} />
        Генератор іскри
      </button>

      <Modal title="Іскра ідеї" isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="max-w-md">
        {idea && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-soft">
              {Icon && <Icon size={14} />}
              {meta.label}
            </div>
            <p className="text-sm leading-relaxed text-parchment">{idea.text}</p>
            <div className="flex justify-end gap-2 border-t border-ink-500 pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-ink-700"
              >
                Закрити
              </button>
              <button
                onClick={reroll}
                className="flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
              >
                <RefreshCw size={14} />
                Ще ідею
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
