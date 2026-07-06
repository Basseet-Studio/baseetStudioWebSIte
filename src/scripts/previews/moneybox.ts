import { bindLiveGhost, createAutoLoop, createGhostCursor } from './ghostCursor'
import type { PreviewController } from './types'

interface Request {
  type: 'withdraw' | 'deposit'
  name: string
  amount: number
}

const REQUEST_POOL: Request[] = [
  { type: 'withdraw', name: 'Kareem', amount: 15 },
  { type: 'deposit', name: 'Meena', amount: 20 },
  { type: 'withdraw', name: 'Ahmed', amount: 5 },
  { type: 'deposit', name: 'Sara', amount: 12 },
  { type: 'withdraw', name: 'Lina', amount: 8 },
  { type: 'deposit', name: 'Omar', amount: 18 },
  { type: 'withdraw', name: 'Fatima', amount: 22 },
  { type: 'deposit', name: 'Yusuf', amount: 30 },
  { type: 'withdraw', name: 'Noor', amount: 10 },
]

function formatAed(amount: number): string {
  return `${amount.toLocaleString('en-AE')} د.إ`
}

export function initMoneyBoxPreview(root: HTMLElement): PreviewController {
  const ghostEl = root.querySelector<HTMLElement>('[data-ghost]')
  const chartEl = root.querySelector<SVGElement>('[data-chart]')
  const queueEl = root.querySelector<HTMLElement>('[data-queue]')
  const logEl = root.querySelector<HTMLElement>('[data-log]')
  const balanceEl = root.querySelector<HTMLElement>('[data-balance]')

  if (!ghostEl || !chartEl || !queueEl || !logEl) return { destroy: () => {} }

  const ghost = createGhostCursor(root, ghostEl)
  const unbindLive = bindLiveGhost(root, ghost)

  let poolHistory = [3120, 3180, 3260, 3210, 3340, 3450]
  let pendingQueue = REQUEST_POOL.slice(0, 5)
  let poolPointer = 5

  function currentPool(): number {
    return poolHistory[poolHistory.length - 1]
  }

  function expectedPool(): number {
    return Math.round(currentPool() * 1.13)
  }

  function chartColors(): { text: string; accent: string } {
    const canvas = root.querySelector<HTMLElement>('.mb-preview__canvas')
    const styles = canvas ? getComputedStyle(canvas) : getComputedStyle(root)
    return {
      text: styles.getPropertyValue('--mb-chart-text').trim() || '#1a1a1a',
      accent: styles.getPropertyValue('--mb-teal').trim() || '#2D7D5E',
    }
  }

  function renderChart(): void {
    const { text: chartText, accent: chartAccent } = chartColors()
    const expected = expectedPool()
    const all = [...poolHistory, expected]
    const min = Math.min(...all)
    const max = Math.max(...all)
    const range = max === min ? 1 : max - min
    const rect = chartEl.getBoundingClientRect()
    const w = Math.max(rect.width, 120)
    const h = 28
    const padTop = 2
    const n = poolHistory.length
    const stepX = n > 1 ? (w - 34) / (n - 1) : 0

    const pts = poolHistory.map((v, i) => {
      const x = i * stepX
      const y = padTop + (h - padTop) * (1 - (v - min) / range)
      return [x, y] as const
    })

    const last = pts[pts.length - 1]
    const expX = w
    const expY = padTop + (h - padTop) * (1 - (expected - min) / range)
    const ns = 'http://www.w3.org/2000/svg'

    chartEl.setAttribute('viewBox', `0 0 ${w} ${h + 6}`)
    chartEl.innerHTML = ''

    const line1 = document.createElementNS(ns, 'polyline')
    line1.setAttribute('points', pts.map((p) => `${p[0]},${p[1]}`).join(' '))
    line1.setAttribute('fill', 'none')
    line1.setAttribute('stroke', chartAccent)
    line1.setAttribute('stroke-width', '2.5')
    line1.setAttribute('stroke-linecap', 'round')
    line1.setAttribute('stroke-linejoin', 'round')
    chartEl.appendChild(line1)

    if (last) {
      const line2 = document.createElementNS(ns, 'line')
      line2.setAttribute('x1', String(last[0]))
      line2.setAttribute('y1', String(last[1]))
      line2.setAttribute('x2', String(expX))
      line2.setAttribute('y2', String(expY))
      line2.setAttribute('stroke', chartAccent)
      line2.setAttribute('stroke-width', '2')
      line2.setAttribute('stroke-dasharray', '3,3')
      line2.setAttribute('opacity', '0.6')
      chartEl.appendChild(line2)

      const dot = document.createElementNS(ns, 'circle')
      dot.setAttribute('cx', String(last[0]))
      dot.setAttribute('cy', String(last[1]))
      dot.setAttribute('r', '3')
      dot.setAttribute('fill', chartAccent)
      chartEl.appendChild(dot)

      const t1 = document.createElementNS(ns, 'text')
      t1.setAttribute('x', String(Math.min(last[0] + 4, w - 60)))
      t1.setAttribute('y', String(Math.max(last[1] - 5, 10)))
      t1.setAttribute('font-size', '10')
      t1.setAttribute('font-weight', '700')
      t1.setAttribute('fill', chartText)
      t1.textContent = formatAed(currentPool())
      chartEl.appendChild(t1)

      const t2 = document.createElementNS(ns, 'text')
      t2.setAttribute('x', String(Math.max(expX - 48, 0)))
      t2.setAttribute('y', String(Math.max(expY - 6, 10)))
      t2.setAttribute('font-size', '8')
      t2.setAttribute('fill', chartAccent)
      t2.textContent = `exp ${formatAed(expected)}`
      chartEl.appendChild(t2)
    }

    if (balanceEl) balanceEl.textContent = formatAed(currentPool())
  }

  function setLog(text: string, color: string): void {
    logEl.className = 'mb-preview__log mb-preview__log--fade'
    logEl.style.color = color
    logEl.textContent = text
  }

  function resolveRequest(action: 'approve' | 'reject' | 'confirm'): void {
    const item = pendingQueue[0]
    if (!item) return

    if (action === 'approve') {
      poolHistory.push(currentPool() - item.amount)
      setLog(`${item.name}'s withdrawal approved −${formatAed(item.amount)}`, '#993c1d')
    } else if (action === 'reject') {
      setLog(`${item.name}'s withdrawal rejected`, '#a32d2d')
    } else {
      poolHistory.push(currentPool() + item.amount)
      setLog(`Confirmed +${formatAed(item.amount)} from ${item.name}`, '#2D7D5E')
    }

    if (poolHistory.length > 7) poolHistory.shift()
    pendingQueue.shift()
    while (pendingQueue.length < 5) {
      pendingQueue.push(REQUEST_POOL[poolPointer % REQUEST_POOL.length])
      poolPointer++
    }
    renderChart()
    renderQueue()
  }

  function renderQueue(): void {
    queueEl.innerHTML = ''
    const top = pendingQueue[0]
    if (!top) return

    pendingQueue.slice(0, 5).forEach((item, i) => {
      const row = document.createElement('div')
      row.className = 'mb-preview__row'
      if (i === 0) row.classList.add('mb-preview__row--active')

      if (i === 0) {
        const label =
          item.type === 'withdraw'
            ? `${item.name} is withdrawing ${formatAed(item.amount)}`
            : `${item.name} contributed ${formatAed(item.amount)}`

        const labelEl = document.createElement('div')
        labelEl.className = 'mb-preview__row-label'
        labelEl.textContent = label
        row.appendChild(labelEl)

        const actions = document.createElement('div')
        actions.className = 'mb-preview__actions'

        if (item.type === 'withdraw') {
          const approve = document.createElement('button')
          approve.type = 'button'
          approve.className = 'mb-preview__btn mb-preview__btn--approve'
          approve.id = 'mb-approve-btn'
          approve.textContent = 'Approve'
          approve.addEventListener('click', () => resolveRequest('approve'))

          const reject = document.createElement('button')
          reject.type = 'button'
          reject.className = 'mb-preview__btn mb-preview__btn--reject'
          reject.id = 'mb-reject-btn'
          reject.textContent = 'Reject'
          reject.addEventListener('click', () => resolveRequest('reject'))

          actions.append(approve, reject)
        } else {
          const confirm = document.createElement('button')
          confirm.type = 'button'
          confirm.className = 'mb-preview__btn mb-preview__btn--confirm'
          confirm.id = 'mb-confirm-btn'
          confirm.textContent = 'Confirm'
          confirm.addEventListener('click', () => resolveRequest('confirm'))
          actions.appendChild(confirm)
        }

        row.appendChild(actions)
      } else {
        const label2 =
          item.type === 'withdraw'
            ? `${item.name} wants ${formatAed(item.amount)}`
            : `${item.name} sent ${formatAed(item.amount)}`
        row.textContent = label2
        row.classList.add('mb-preview__row--muted')
      }

      queueEl.appendChild(row)
    })
  }

  const resizeObserver = new ResizeObserver(() => renderChart())
  resizeObserver.observe(chartEl)

  renderChart()
  renderQueue()

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const loop = createAutoLoop(
    root,
    (done) => {
      const top = pendingQueue[0]
      if (!top) {
        done()
        return
      }
      const btnId =
        top.type === 'withdraw'
          ? Math.random() < 0.75
            ? 'mb-approve-btn'
            : 'mb-reject-btn'
          : 'mb-confirm-btn'
      const btn = document.getElementById(btnId)
      if (!btn) {
        done()
        return
      }
      ghost.moveTo(btn)
      setTimeout(() => {
        ghost.click()
        resolveRequest(
          btnId === 'mb-approve-btn' ? 'approve' : btnId === 'mb-reject-btn' ? 'reject' : 'confirm',
        )
        done()
      }, reduced ? 0 : 750)
    },
    3000,
  )

  loop.start()

  const themeObserver = new MutationObserver(() => renderChart())
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  return {
    destroy: () => {
      loop.destroy()
      resizeObserver.disconnect()
      themeObserver.disconnect()
      unbindLive()
      ghost.destroy()
    },
  }
}
