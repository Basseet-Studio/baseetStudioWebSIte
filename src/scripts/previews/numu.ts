import { bindLiveGhost, createAutoLoop, createGhostCursor } from './ghostCursor'
import type { PreviewController } from './types'

interface Habit {
  id: number
  name: string
  variant: 'water' | 'read'
  days: boolean[]
}

function calcStreak(days: boolean[]): number {
  let s = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i]) s++
    else break
  }
  return s
}

const HABIT_ICONS: Record<Habit['variant'], string> = {
  water: '💧',
  read: '📖',
}

export function initNumuPreview(root: HTMLElement): PreviewController {
  const ghostEl = root.querySelector<HTMLElement>('[data-ghost]')
  const listEl = root.querySelector<HTMLElement>('[data-habit-list]')
  if (!ghostEl || !listEl) return { destroy: () => {} }

  const ghost = createGhostCursor(root, ghostEl)
  const unbindLive = bindLiveGhost(root, ghost)

  const habits: Habit[] = [
    {
      id: 1,
      name: 'Drink water',
      variant: 'water',
      days: [true, false, true, true, false, true, false],
    },
    {
      id: 2,
      name: 'Read 10 pages',
      variant: 'read',
      days: [true, true, false, true, true, false, false],
    },
  ]

  const todayIdx = 6

  function toggleDay(id: number, idx: number): void {
    const h = habits.find((x) => x.id === id)
    if (h) {
      h.days[idx] = !h.days[idx]
      render()
    }
  }

  function render(): void {
    listEl.innerHTML = ''
    habits.forEach((h) => {
      const streak = calcStreak(h.days)
      const score = Math.round((h.days.filter(Boolean).length / 7) * 100)

      const card = document.createElement('div')
      card.className = 'nu-preview__card'

      const head = document.createElement('div')
      head.className = 'nu-preview__head'
      head.innerHTML = `
        <div class="nu-preview__meta">
          <span class="nu-preview__icon nu-preview__icon--${h.variant}">${HABIT_ICONS[h.variant]}</span>
          <span class="nu-preview__name">${h.name}</span>
        </div>
        <span class="nu-preview__streak">🔥 ${streak}</span>
      `
      card.appendChild(head)

      const row = document.createElement('div')
      row.className = 'nu-preview__days'
      h.days.forEach((done, idx) => {
        const sq = document.createElement('button')
        sq.type = 'button'
        sq.className = 'nu-preview__day'
        sq.dataset.habitId = String(h.id)
        sq.dataset.dayIdx = String(idx)
        sq.setAttribute('aria-label', `${h.name} day ${idx + 1}, ${done ? 'done' : 'missed'}`)
        if (done) sq.classList.add('nu-preview__day--done')
        else sq.classList.add('nu-preview__day--missed')
        if (idx === todayIdx) sq.classList.add('nu-preview__day--today')
        sq.addEventListener('click', () => toggleDay(h.id, idx))
        row.appendChild(sq)
      })
      card.appendChild(row)

      const scoreRow = document.createElement('div')
      scoreRow.className = 'nu-preview__score'
      scoreRow.textContent = `${score}% score`
      card.appendChild(scoreRow)

      listEl.appendChild(card)
    })
  }

  render()

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const loop = createAutoLoop(
    root,
    (done) => {
      const h = habits[Math.floor(Math.random() * habits.length)]
      const idx = Math.floor(Math.random() * h.days.length)
      const sq = root.querySelector(
        `.nu-preview__day[data-habit-id="${h.id}"][data-day-idx="${idx}"]`,
      )
      if (!sq) {
        done()
        return
      }
      ghost.moveTo(sq)
      setTimeout(() => {
        ghost.click()
        toggleDay(h.id, idx)
        done()
      }, reduced ? 0 : 700)
    },
    1800,
  )

  loop.start()

  return {
    destroy: () => {
      loop.destroy()
      unbindLive()
      ghost.destroy()
    },
  }
}
