import { bindLiveGhost, createAutoLoop, createGhostCursor } from './ghostCursor'
import type { PreviewController } from './types'

type Column = 'todo' | 'doing' | 'review' | 'done'
type Priority = 'high' | 'medium' | 'critical'

interface Card {
  id: number
  title: string
  col: Column
  priority: Priority
}

const COLUMNS: Column[] = ['todo', 'doing', 'review', 'done']

const COLUMN_LABELS: Record<Column, string> = {
  todo: 'To Do',
  doing: 'In Prog',
  review: 'Review',
  done: 'Done',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  critical: 'Critical',
}

export function initMatrixPreview(root: HTMLElement): PreviewController {
  const ghostEl = root.querySelector<HTMLElement>('[data-ghost]')
  if (!ghostEl) return { destroy: () => {} }

  const ghost = createGhostCursor(root, ghostEl)
  const unbindLive = bindLiveGhost(root, ghost)

  let cards: Card[] = [
    { id: 1, title: 'Docs collab', col: 'todo', priority: 'medium' },
    { id: 2, title: 'Fix auth sync', col: 'todo', priority: 'high' },
    { id: 3, title: 'Find bugs', col: 'doing', priority: 'critical' },
    { id: 4, title: 'CRDT sync', col: 'doing', priority: 'high' },
    { id: 5, title: 'Pricing copy', col: 'review', priority: 'medium' },
    { id: 6, title: 'QA pass', col: 'done', priority: 'medium' },
  ]

  function nextColumn(col: Column): Column {
    const idx = COLUMNS.indexOf(col)
    return COLUMNS[(idx + 1) % COLUMNS.length]
  }

  function updateColumnCounts(): void {
    COLUMNS.forEach((col) => {
      const label = root.querySelector<HTMLElement>(`[data-col-label="${col}"]`)
      if (!label) return
      const count = cards.filter((c) => c.col === col).length
      label.textContent = `${COLUMN_LABELS[col]} (${count})`
    })
    const taskCount = root.querySelector<HTMLElement>('[data-task-count]')
    if (taskCount) taskCount.textContent = `${cards.length} tasks`
  }

  function render(): void {
    COLUMNS.forEach((col) => {
      const body = root.querySelector<HTMLElement>(`[data-body="${col}"]`)
      if (!body) return
      body.innerHTML = ''
      cards
        .filter((c) => c.col === col)
        .forEach((c) => {
          const card = document.createElement('div')
          card.className = `mx-preview__card mx-preview__card--${c.priority}`
          card.draggable = true
          card.dataset.cardId = String(c.id)
          card.tabIndex = 0
          card.innerHTML = `
            <span class="mx-preview__card-title">${c.title}</span>
            <span class="mx-preview__pri mx-preview__pri--${c.priority}">${PRIORITY_LABELS[c.priority]}</span>
          `
          card.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('text/plain', String(c.id))
          })
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              c.col = nextColumn(c.col)
              render()
            }
          })
          body.appendChild(card)
        })
    })
    updateColumnCounts()
  }

  root.querySelectorAll<HTMLElement>('[data-col]').forEach((colEl) => {
    colEl.addEventListener('dragover', (e) => e.preventDefault())
    colEl.addEventListener('drop', (e) => {
      e.preventDefault()
      const id = parseInt(e.dataTransfer?.getData('text/plain') ?? '', 10)
      const card = cards.find((c) => c.id === id)
      const target = colEl.dataset.col as Column | undefined
      if (card && target) {
        card.col = target
        render()
      }
    })
  })

  render()

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const moveDelay = reduced ? 0 : 700

  const loop = createAutoLoop(
    root,
    (done) => {
      const card = cards[Math.floor(Math.random() * cards.length)]
      const targets = COLUMNS.filter((c) => c !== card.col)
      const target = targets[Math.floor(Math.random() * targets.length)]
      const cardEl = root.querySelector(`[data-card-id="${card.id}"]`)
      if (!cardEl) {
        done()
        return
      }

      const board = root.querySelector<HTMLElement>('[data-board]')
      cardEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })

      ghost.moveTo(cardEl)
      setTimeout(() => {
        ghost.click()
        setTimeout(() => {
          const targetBody = root.querySelector(`[data-body="${target}"]`)
          if (!targetBody) {
            done()
            return
          }
          targetBody.closest('[data-col]')?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center',
          })
          ghost.moveTo(targetBody)
          setTimeout(() => {
            ghost.click()
            card.col = target
            render()
            if (board && !reduced) {
              const colEl = targetBody.closest('[data-col]')
              colEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
            done()
          }, moveDelay)
        }, reduced ? 0 : 300)
      }, moveDelay)
    },
    1400,
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
