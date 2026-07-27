const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  ENTER_TRANSITION_MS: 180,
}

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max)
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision))
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin))

type TiltEngine = {
  setImmediate: (x: number, y: number) => void
  setTarget: (x: number, y: number) => void
  toCenter: () => void
  beginInitial: (durationMs: number) => void
  getCurrent: () => { x: number; y: number; tx: number; ty: number }
  cancel: () => void
}

function createTiltEngine(wrap: HTMLElement, shell: HTMLElement): TiltEngine {
  let rafId: number | null = null
  let running = false
  let lastTs = 0
  let currentX = 0
  let currentY = 0
  let targetX = 0
  let targetY = 0
  let initialUntil = 0

  const setVarsFromXY = (x: number, y: number) => {
    const width = shell.clientWidth || 1
    const height = shell.clientHeight || 1
    const percentX = clamp((100 / width) * x)
    const percentY = clamp((100 / height) * y)
    const centerX = percentX - 50
    const centerY = percentY - 50

    const properties: Record<string, string> = {
      '--pointer-x': `${percentX}%`,
      '--pointer-y': `${percentY}%`,
      '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
      '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
      '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
      '--pointer-from-top': `${percentY / 100}`,
      '--pointer-from-left': `${percentX / 100}`,
      '--rotate-x': `${round(-(centerX / 6))}deg`,
      '--rotate-y': `${round(centerY / 5)}deg`,
    }

    for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v)
  }

  const step = (ts: number) => {
    if (!running) return
    if (lastTs === 0) lastTs = ts
    const dt = (ts - lastTs) / 1000
    lastTs = ts
    const tau = ts < initialUntil ? 0.6 : 0.14
    const k = 1 - Math.exp(-dt / tau)
    currentX += (targetX - currentX) * k
    currentY += (targetY - currentY) * k
    setVarsFromXY(currentX, currentY)

    const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05
    if (stillFar || document.hasFocus()) {
      rafId = requestAnimationFrame(step)
    } else {
      running = false
      lastTs = 0
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  }

  const start = () => {
    if (running) return
    running = true
    lastTs = 0
    rafId = requestAnimationFrame(step)
  }

  return {
    setImmediate(x, y) {
      currentX = x
      currentY = y
      setVarsFromXY(currentX, currentY)
    },
    setTarget(x, y) {
      targetX = x
      targetY = y
      start()
    },
    toCenter() {
      this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2)
    },
    beginInitial(durationMs) {
      initialUntil = performance.now() + durationMs
      start()
    },
    getCurrent() {
      return { x: currentX, y: currentY, tx: targetX, ty: targetY }
    },
    cancel() {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = null
      running = false
      lastTs = 0
    },
  }
}

type CardController = { destroy: () => void }
const controllers = new WeakMap<HTMLElement, CardController>()

function getOffsets(evt: PointerEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
}

function mountCard(wrap: HTMLElement): CardController {
  const shell = wrap.querySelector<HTMLElement>('.pc-card-shell')
  if (!shell) return { destroy: () => {} }

  const enableTilt = wrap.dataset.enableTilt !== 'false'
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!enableTilt || reducedMotion) {
    ;[
      ['--pointer-x', '50%'],
      ['--pointer-y', '50%'],
      ['--pointer-from-center', '0'],
      ['--pointer-from-top', '0.5'],
      ['--pointer-from-left', '0.5'],
      ['--rotate-x', '0deg'],
      ['--rotate-y', '0deg'],
      ['--background-x', '50%'],
      ['--background-y', '50%'],
    ].forEach(([k, v]) => wrap.style.setProperty(k, v))
    return { destroy: () => {} }
  }

  const tiltEngine = createTiltEngine(wrap, shell)
  let enterTimer: number | null = null
  let leaveRaf: number | null = null

  const onMove = (event: PointerEvent) => {
    const { x, y } = getOffsets(event, shell)
    tiltEngine.setTarget(x, y)
  }

  const onEnter = (event: PointerEvent) => {
    shell.classList.add('active', 'entering')
    wrap.classList.add('active')
    if (enterTimer) window.clearTimeout(enterTimer)
    enterTimer = window.setTimeout(() => shell.classList.remove('entering'), ANIMATION_CONFIG.ENTER_TRANSITION_MS)
    const { x, y } = getOffsets(event, shell)
    tiltEngine.setTarget(x, y)
  }

  const onLeave = () => {
    tiltEngine.toCenter()
    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent()
      if (Math.hypot(tx - x, ty - y) < 0.6) {
        shell.classList.remove('active')
        wrap.classList.remove('active')
        leaveRaf = null
      } else {
        leaveRaf = requestAnimationFrame(checkSettle)
      }
    }
    if (leaveRaf) cancelAnimationFrame(leaveRaf)
    leaveRaf = requestAnimationFrame(checkSettle)
  }

  shell.addEventListener('pointerenter', onEnter)
  shell.addEventListener('pointermove', onMove)
  shell.addEventListener('pointerleave', onLeave)

  const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET
  tiltEngine.setImmediate(initialX, ANIMATION_CONFIG.INITIAL_Y_OFFSET)
  tiltEngine.toCenter()
  tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION)

  return {
    destroy() {
      shell.removeEventListener('pointerenter', onEnter)
      shell.removeEventListener('pointermove', onMove)
      shell.removeEventListener('pointerleave', onLeave)
      if (enterTimer) window.clearTimeout(enterTimer)
      if (leaveRaf) cancelAnimationFrame(leaveRaf)
      tiltEngine.cancel()
      shell.classList.remove('entering', 'active')
      wrap.classList.remove('active')
    },
  }
}

export function initProfileCards(scope: ParentNode = document): () => void {
  const wraps = scope.querySelectorAll<HTMLElement>('[data-profile-card]')
  for (const wrap of wraps) {
    if (controllers.has(wrap)) continue
    controllers.set(wrap, mountCard(wrap))
  }
  return () => destroyProfileCards(scope)
}

export function destroyProfileCards(scope: ParentNode = document): void {
  for (const wrap of scope.querySelectorAll<HTMLElement>('[data-profile-card]')) {
    const ctrl = controllers.get(wrap)
    if (ctrl) {
      ctrl.destroy()
      controllers.delete(wrap)
    }
  }
}
