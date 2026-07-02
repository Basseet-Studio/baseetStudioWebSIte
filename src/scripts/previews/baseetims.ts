import { bindLiveGhost, createAutoLoop, createGhostCursor } from './ghostCursor'
import type { PreviewController } from './types'

interface ShopMetrics {
  id: number
  name: string
  revenue: number
  cash: number
  profit: number
  flexi: number
  due: number
  trend: number[]
}

const SHOPS: ShopMetrics[] = [
  {
    id: 1,
    name: 'Faruk Library',
    revenue: 2840,
    cash: 1920,
    profit: 680,
    flexi: 145,
    due: 12360,
    trend: [1200, 1800, 2400, 2100, 2840],
  },
  {
    id: 2,
    name: 'DBBL Agent',
    revenue: 1560,
    cash: 980,
    profit: 420,
    flexi: 88,
    due: 4200,
    trend: [800, 1100, 900, 1300, 1560],
  },
  {
    id: 3,
    name: 'Integration 01',
    revenue: 920,
    cash: 640,
    profit: 210,
    flexi: 52,
    due: 890,
    trend: [400, 600, 750, 820, 920],
  },
  {
    id: 4,
    name: 'Telecom Counter',
    revenue: 3100,
    cash: 2450,
    profit: 890,
    flexi: 210,
    due: 5600,
    trend: [1500, 2000, 2600, 2800, 3100],
  },
  {
    id: 5,
    name: 'Corner Store',
    revenue: 540,
    cash: 380,
    profit: 120,
    flexi: 30,
    due: 320,
    trend: [200, 350, 400, 480, 540],
  },
]

function formatBdt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function animateValue(el: HTMLElement, target: number, duration = 400): void {
  const start = parseInt(el.textContent?.replace(/\D/g, '') ?? '0', 10) || 0
  const startTime = performance.now()

  function tick(now: number): void {
    const t = Math.min((now - startTime) / duration, 1)
    const eased = 1 - (1 - t) ** 3
    const current = Math.round(start + (target - start) * eased)
    el.textContent = formatBdt(current)
    if (t < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

export function initBaseetIMSPreview(root: HTMLElement): PreviewController {
  const ghostEl = root.querySelector<HTMLElement>('[data-ghost]')
  const chartEl = root.querySelector<SVGElement>('[data-chart]')
  const shopListEl = root.querySelector<HTMLElement>('[data-shop-list]')
  const canvas = root.querySelector<HTMLElement>('.ims-preview__canvas') ?? root

  if (!ghostEl || !chartEl || !shopListEl) return { destroy: () => {} }

  const ghost = createGhostCursor(root, ghostEl)
  const unbindLive = bindLiveGhost(root, ghost)

  let activeIdx = 0

  function canvasStyle(): CSSStyleDeclaration {
    return getComputedStyle(canvas)
  }

  function getChartColor(): string {
    return canvasStyle().getPropertyValue('--ims-chart-line').trim() || '#10b981'
  }

  function renderChart(trend: number[]): void {
    const color = getChartColor()
    const gridColor = canvasStyle().getPropertyValue('--ims-border').trim() || '#243038'
    const w = 200
    const h = 56
    const pad = 6
    const min = Math.min(...trend)
    const max = Math.max(...trend)
    const range = max - min || 1
    const stepX = (w - pad * 2) / (trend.length - 1)
    const pts = trend
      .map((v, i) => {
        const x = pad + i * stepX
        const y = pad + (h - pad * 2) * (1 - (v - min) / range)
        return `${x},${y}`
      })
      .join(' ')

    const ns = 'http://www.w3.org/2000/svg'
    chartEl.innerHTML = ''
    chartEl.setAttribute('viewBox', `0 0 ${w} ${h}`)

    for (let i = 1; i <= 2; i++) {
      const gy = pad + ((h - pad * 2) * i) / 3
      const line = document.createElementNS(ns, 'line')
      line.setAttribute('x1', String(pad))
      line.setAttribute('x2', String(w - pad))
      line.setAttribute('y1', String(gy))
      line.setAttribute('y2', String(gy))
      line.setAttribute('stroke', gridColor)
      line.setAttribute('stroke-width', '0.5')
      chartEl.appendChild(line)
    }

    const poly = document.createElementNS(ns, 'polyline')
    poly.setAttribute('points', pts)
    poly.setAttribute('fill', 'none')
    poly.setAttribute('stroke', color)
    poly.setAttribute('stroke-width', '2')
    poly.setAttribute('stroke-linecap', 'round')
    poly.setAttribute('stroke-linejoin', 'round')
    chartEl.appendChild(poly)

    const last = trend[trend.length - 1]
    const lastX = pad + (trend.length - 1) * stepX
    const lastY = pad + (h - pad * 2) * (1 - (last - min) / range)
    const dot = document.createElementNS(ns, 'circle')
    dot.setAttribute('cx', String(lastX))
    dot.setAttribute('cy', String(lastY))
    dot.setAttribute('r', '2.5')
    dot.setAttribute('fill', color)
    chartEl.appendChild(dot)
  }

  function updateKpis(shop: ShopMetrics): void {
    const keys = ['revenue', 'cash', 'profit', 'flexi', 'due'] as const
    keys.forEach((key) => {
      const el = root.querySelector<HTMLElement>(`[data-kpi-value="${key}"]`)
      if (el) animateValue(el, shop[key])
    })
    renderChart(shop.trend)
  }

  function renderShops(): void {
    shopListEl.innerHTML = ''
    SHOPS.forEach((shop, i) => {
      const row = document.createElement('div')
      row.className = `ims-preview__shop-row${i === activeIdx ? ' ims-preview__shop-row--active' : ''}`
      row.dataset.shopId = String(shop.id)
      row.innerHTML = `
        <span class="ims-preview__shop-row-name">${shop.name}</span>
        <span class="ims-preview__shop-row-sales">${formatBdt(shop.revenue)}</span>
      `
      row.addEventListener('click', () => selectShop(i))
      shopListEl.appendChild(row)
    })
  }

  function selectShop(idx: number): void {
    activeIdx = idx
    renderShops()
    updateKpis(SHOPS[activeIdx])
  }

  renderShops()
  updateKpis(SHOPS[0])

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const moveDelay = reduced ? 0 : 600

  const loop = createAutoLoop(
    root,
    (done) => {
      const nextIdx = (activeIdx + 1) % SHOPS.length
      const row = shopListEl.querySelector<HTMLElement>(`[data-shop-id="${SHOPS[nextIdx].id}"]`)
      if (!row) {
        done()
        return
      }

      ghost.moveTo(row)
      setTimeout(() => {
        ghost.click()
        selectShop(nextIdx)
        done()
      }, moveDelay)
    },
    2500,
  )

  loop.start()

  const themeObserver = new MutationObserver(() => {
    renderChart(SHOPS[activeIdx].trend)
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  return {
    destroy: () => {
      loop.destroy()
      unbindLive()
      ghost.destroy()
      themeObserver.disconnect()
    },
  }
}
