import { useState } from 'react'
import {
  Sparkles, BookOpen, Users, Shield, GitBranch, Map, Clock, BookText,
  Bell, ListTree, Layers, FileText, Search, Link2, KeyRound, Globe,
  ChevronDown, Mail, HelpCircle, Send,
} from 'lucide-react'
import InkStroke from '../components/layout/InkStroke'

const QUICK_START = [
  { title: 'Створіть проєкт', text: 'Кожен проєкт — окремий світ. У розділі «Проєкти» натисніть «Новий проєкт» і дайте йому назву.' },
  { title: 'Додайте персонажів і фракції', text: 'Заповніть анкети — можна повністю вручну або обрати готовий шаблон для швидкого старту.' },
  { title: "З'єднайте їх зв'язками", text: 'На сторінці «Зв\'язки» покажіть, хто кому друг, ворог чи родич — побачите це на інтерактивній карті зв\'язків.' },
  { title: 'Розкладіть події на таймлайні', text: 'Додавайте події, групуйте їх у ери й сюжетні арки, стежте за причинно-наслідковими зв\'язками.' },
  { title: 'Ведіть нотатки в Бібліотеці', text: 'Усе, що не є персонажем чи локацією — магічні системи, культура, історія — записуйте статтями.' },
]

const SECTIONS = [
  { icon: Users, label: 'Персонажі', text: 'Детальні анкети з описом, історією, мотивацією, стосунками. Підтримують шаблони.' },
  { icon: Shield, label: 'Фракції', text: 'Організації, ордени, гільдії — з власним складом і персонажами-учасниками.' },
  { icon: GitBranch, label: "Зв'язки", text: 'Стосунки між персонажами — списком або на інтерактивній карті.' },
  { icon: Map, label: 'Мапа світу', text: 'Локації на інтерактивній карті, з\'єднані зв\'язками, організовані за паралельними вимірами.' },
  { icon: Clock, label: 'Таймлайн', text: 'Хронологія подій — з ерами, сюжетними арками, альтернативними гілками.' },
  { icon: BookText, label: 'Бібліотека', text: 'Довідкові статті про світ — усе, що не є персонажем, локацією чи подією.' },
  { icon: Sparkles, label: 'Атмосфера', text: 'Саундтрек і мудборд, що передають настрій вашого світу.' },
  { icon: Layers, label: 'Структура', text: 'Довільні розділи для нотаток, які не вписуються нікуди інакше.' },
  { icon: ListTree, label: 'Каркас сюжету', text: 'Максимально коротка схема всієї історії — не план по главах.' },
  { icon: Bell, label: 'Не забути', text: 'Швидкі нотатки й обіцянки самій собі.' },
  { icon: FileText, label: 'Шаблони', text: 'Вбудовані та власні шаблони анкет персонажів.' },
]

const NUANCES = [
  {
    icon: Link2,
    q: 'Що таке [[Назва]] у текстових полях?',
    a: 'Якщо написати назву персонажа, локації, фракції, статті чи власної сторінки у подвійних квадратних дужках — наприклад [[Лірана Вернтор]] — цей текст стане клікабельним посиланням, і клік одразу перенесе вас на відповідну сторінку. Працює в описах, біографіях, блоках Структури й Власних сторінок.',
  },
  {
    icon: Search,
    q: 'Як швидко щось знайти?',
    a: 'Натисніть Ctrl+K (або Cmd+K на Mac) з будь-якої сторінки — відкриється глобальний пошук по персонажах, фракціях, локаціях, статтях, подіях і власних сторінках.',
  },
  {
    icon: KeyRound,
    q: 'Що таке гостьовий режим?',
    a: 'Кнопка «Продовжити без акаунту» дозволяє спробувати сайт без реєстрації. Але майте на увазі: без акаунту дані не зберігаються на сервері — тож для довгострокової роботи над своїм світом краще зареєструватись.',
  },
  {
    icon: FileText,
    q: 'Чим власні шаблони відрізняються від вбудованих?',
    a: 'Вбудовані шаблони (Протагоніст, Антагоніст, Наставник тощо) готові одразу. Власні шаблони ви створюєте самі в розділі «Шаблони» — обираєте, які поля анкети включити, і даєте їм свої підписи.',
  },
  {
    icon: Globe,
    q: 'Що таке "виміри" на мапі світу?',
    a: 'Якщо у вашій історії є паралельні світи чи альтернативні реальності — можна створити окремий вимір і додавати локації саме туди, перемикаючись між ними прямо на мапі.',
  },
  {
    icon: GitBranch,
    q: 'Що таке "гілки" таймлайну?',
    a: 'Гілка — це альтернативна версія подій ("що було б, якби..."), що відгалужується від основної лінії у певній точці. Зручно для дослідження "а що, якщо" без плутанини з основним сюжетом.',
  },
]

const FAQ = [
  { q: 'Чи безпечні мої дані?', a: 'Так. Доступ до ваших проєктів має лише ваш акаунт — навіть гості без реєстрації не бачать чужих даних.' },
  { q: 'Забула пароль — що робити?', a: 'На сторінці входу натисніть «Забули пароль?» і вкажіть email — надійде лист із посиланням для скидання пароля.' },
  { q: 'Чи буде мобільна версія?', a: 'Сайт активно адаптується під телефони й планшети. Якщо щось незручно — обов\'язково повідомте, це допомагає визначити пріоритети.' },
  { q: 'Чи можна зберегти свій світ поза сайтом?', a: 'Так — на сторінці «Проєкти» є кнопка завантаження, яка експортує весь вміст проєкту в один Markdown-файл.' },
]

function AccordionItem({ icon: Icon, question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-ink-500 bg-ink-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {Icon && <Icon size={16} className="shrink-0 text-amber-soft" />}
        <span className="flex-1 text-sm font-medium text-parchment">{question}</span>
        <ChevronDown size={16} className={`shrink-0 text-parchment-dim transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="border-t border-ink-500 px-4 py-3 text-sm text-parchment-dim">
          {answer}
        </p>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <HelpCircle size={28} className="text-amber-soft" strokeWidth={1.5} />
        <div>
          <h2 className="font-display text-3xl font-medium text-parchment">Допомога</h2>
          <InkStroke className="mt-1" width={90} />
        </div>
      </div>
      <p className="mt-3 max-w-xl text-sm text-parchment-dim">
        Короткий довідник по StoryLore — з чого почати, що є що, і відповіді на часті запитання.
      </p>

      {/* Швидкий старт */}
      <section className="mt-10">
        <h3 className="font-display text-xl font-medium text-parchment">Швидкий старт</h3>
        <InkStroke className="mt-1" width={60} color="var(--ink-500)" />
        <div className="mt-4 flex flex-col gap-3">
          {QUICK_START.map((step, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-ink-500 bg-ink-800 px-4 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-ink/15 text-xs font-medium text-amber-soft">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-parchment">{step.title}</p>
                <p className="mt-0.5 text-sm text-parchment-dim">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Розділи сайту */}
      <section className="mt-10">
        <h3 className="font-display text-xl font-medium text-parchment">Розділи сайту</h3>
        <InkStroke className="mt-1" width={60} color="var(--ink-500)" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SECTIONS.map(({ icon: Icon, label, text }) => (
            <div key={label} className="flex gap-3 rounded-lg border border-ink-500 bg-ink-800 px-4 py-3">
              <Icon size={16} className="mt-0.5 shrink-0 text-parchment-dim" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-parchment">{label}</p>
                <p className="mt-0.5 text-xs text-parchment-dim">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Неочевидні нюанси */}
      <section className="mt-10">
        <h3 className="font-display text-xl font-medium text-parchment">Корисні нюанси</h3>
        <InkStroke className="mt-1" width={60} color="var(--ink-500)" />
        <div className="mt-4 flex flex-col gap-2">
          {NUANCES.map((n, i) => (
            <AccordionItem key={i} icon={n.icon} question={n.q} answer={n.a} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h3 className="font-display text-xl font-medium text-parchment">Часті питання</h3>
        <InkStroke className="mt-1" width={60} color="var(--ink-500)" />
        <div className="mt-4 flex flex-col gap-2">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </section>

      {/* Зворотний зв'язок */}
      <section className="mt-10 mb-10 rounded-lg border border-amber-ink/40 bg-amber-ink/10 px-5 py-5">
        <div className="flex items-start gap-3">
          <Mail size={20} className="mt-0.5 shrink-0 text-amber-soft" />
          <div>
            <h3 className="font-display text-lg font-medium text-parchment">Знайшли баг чи є ідея?</h3>
            <p className="mt-1 text-sm text-parchment-dim">
              StoryLore — сайт, що активно розвивається, і кожен відгук справді впливає на те,
              яким він стане. Пишіть про все — від дрібних незручностей до великих ідей.
            </p>
            {/* ЗАПОВНИ: встав посилання на свій Telegram (наприклад https://t.me/ladookk) */}
            <a
              href="https://t.me/ladookk"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-ink px-4 py-2 text-sm font-medium text-ink-900 hover:bg-amber-soft"
            >
              <Send size={14} /> Написати в Telegram
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
