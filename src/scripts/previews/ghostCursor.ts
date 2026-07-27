import type { AutoLoop, AutoLoopStep, GhostCursor } from './types'

const GHOST_OFFSET = 8
const ARROW_GHOST_OFFSET = 4

function ghostOffset(container: HTMLElement): number {
  const type = container.dataset.previewType
  return type === 'matrix' || type === 'invexo' ? ARROW_GHOST_OFFSET : GHOST_OFFSET
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function relCenter(stage: HTMLElement, el: Element): { x: number; y: number } {
  const offset = ghostOffset(stage)
  const sr = stage.getBoundingClientRect()
  const er = el.getBoundingClientRect()
  return {
    x: er.left - sr.left + er.width / 2 - offset,
    y: er.top - sr.top + er.height / 2 - offset,
  }
}

export function createGhostCursor(container: HTMLElement, ghostEl: HTMLElement): GhostCursor {
  const reduced = prefersReducedMotion()

  function moveTo(el: Element): void {
    const pos = relCenter(container, el)
    if (reduced) {
      ghostEl.style.transition = 'none'
    }
    ghostEl.style.left = `${pos.x}px`
    ghostEl.style.top = `${pos.y}px`
    if (reduced) {
      requestAnimationFrame(() => {
        ghostEl.style.transition = ''
      })
    }
  }

  function click(): void {
    ghostEl.classList.add('preview-ghost--pulse')
    window.setTimeout(() => ghostEl.classList.remove('preview-ghost--pulse'), 350)
  }

  function show(): void {
    ghostEl.style.opacity = '1'
  }

  function hide(): void {
    ghostEl.style.opacity = '0'
  }

  function destroy(): void {
    ghostEl.remove()
  }

  return { moveTo, click, show, hide, destroy }
}

export function createAutoLoop(
  container: HTMLElement,
  stepFn: AutoLoopStep,
  delay: number,
): AutoLoop {
  let live = false
  let visible = true
  let docVisible = !document.hidden
  let touchIdleTimer: ReturnType<typeof setTimeout> | null = null
  let tickTimer: ReturnType<typeof setTimeout> | null = null
  let running = false
  const reduced = prefersReducedMotion()
  const effectiveDelay = reduced ? delay * 2.5 : delay
  const TOUCH_IDLE_MS = 4000

  function canRun(): boolean {
    return !live && visible && docVisible
  }

  function clearTick(): void {
    if (tickTimer !== null) {
      clearTimeout(tickTimer)
      tickTimer = null
    }
  }

  function scheduleTick(ms: number): void {
    clearTick()
    tickTimer = setTimeout(tick, ms)
  }

  function tick(): void {
    if (!running) return
    if (!canRun()) {
      scheduleTick(500)
      return
    }
    stepFn(() => scheduleTick(effectiveDelay))
  }

  function onPointerEnter(): void {
    live = true
  }

  function onPointerLeave(): void {
    live = false
    if (touchIdleTimer !== null) {
      clearTimeout(touchIdleTimer)
      touchIdleTimer = null
    }
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      live = true
      if (touchIdleTimer !== null) clearTimeout(touchIdleTimer)
      touchIdleTimer = setTimeout(() => {
        live = false
        touchIdleTimer = null
      }, TOUCH_IDLE_MS)
    }
  }

  function onVisibilityChange(): void {
    docVisible = !document.hidden
  }

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry) return
      visible = entry.isIntersecting
    },
    { root: null, threshold: 0.1 },
  )

  intersectionObserver.observe(container)

  container.addEventListener('pointerenter', onPointerEnter)
  container.addEventListener('pointerleave', onPointerLeave)
  container.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('visibilitychange', onVisibilityChange)

  function start(): void {
    if (running) return
    running = true
    scheduleTick(reduced ? 1200 : 900)
  }

  function stop(): void {
    running = false
    clearTick()
  }

  function destroy(): void {
    stop()
    intersectionObserver.disconnect()
    container.removeEventListener('pointerenter', onPointerEnter)
    container.removeEventListener('pointerleave', onPointerLeave)
    container.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    if (touchIdleTimer !== null) clearTimeout(touchIdleTimer)
  }

  return { start, stop, destroy }
}

export function bindLiveGhost(
  container: HTMLElement,
  ghost: GhostCursor,
): () => void {
  function onEnter(): void {
    ghost.hide()
  }
  function onLeave(): void {
    ghost.show()
  }
  container.addEventListener('pointerenter', onEnter)
  container.addEventListener('pointerleave', onLeave)
  return () => {
    container.removeEventListener('pointerenter', onEnter)
    container.removeEventListener('pointerleave', onLeave)
  }
}
