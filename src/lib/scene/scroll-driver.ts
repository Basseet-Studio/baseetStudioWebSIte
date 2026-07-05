export interface ScrollDriverMeta {
  source?: string
  force?: boolean
  scrollY?: number
  scrollMax?: number
  progress?: number
  anchorRange?: [number, number]
}

export interface ScrollDriver {
  attach: () => void
  detach: () => void
  tick: (meta?: ScrollDriverMeta) => void
  getProgress: () => number
  reset: () => void
}

export function getScrollProgress(): number {
  const scrollMax = document.documentElement.scrollHeight - window.innerHeight
  if (scrollMax <= 0) return 0
  return Math.min(Math.max(window.scrollY / scrollMax, 0), 1)
}

export function createScrollDriver(options: {
  onProgress: (progress: number, meta: ScrollDriverMeta) => void
  throttle?: 'raf' | 'none'
}): ScrollDriver {
  const onProgress = options.onProgress
  let ticking = false
  let attached = false
  let lastProgress = -1

  function tick(meta: ScrollDriverMeta = {}): void {
    const progress = getScrollProgress()
    if (progress === lastProgress && !meta.force) return
    lastProgress = progress
    onProgress(progress, {
      scrollY: window.scrollY,
      scrollMax: document.documentElement.scrollHeight - window.innerHeight,
      ...meta,
    })
  }

  function onScroll(): void {
    if (options.throttle === 'none') {
      tick({ source: 'scroll' })
      return
    }
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      tick({ source: 'scroll' })
      ticking = false
    })
  }

  function onResize(): void {
    tick({ source: 'resize', force: true })
  }

  function onAfterSwap(): void {
    lastProgress = -1
    requestAnimationFrame(() => {
      tick({ source: 'astro:after-swap', force: true })
    })
  }

  function onSectionProgress(event: Event): void {
    const detail = (event as CustomEvent).detail || {}
    if (typeof detail.progress !== 'number') return
    const range = detail.anchorRange as [number, number] | undefined
    if (Array.isArray(range) && range.length === 2) {
      const globalP = range[0] + detail.progress * (range[1] - range[0])
      lastProgress = globalP
      onProgress(globalP, { source: 'section', ...detail })
    }
  }

  return {
    attach() {
      if (attached) return
      attached = true
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      document.addEventListener('astro:after-swap', onAfterSwap)
      document.addEventListener('baseet:section-progress', onSectionProgress)
      tick({ source: 'attach', force: true })
    },
    detach() {
      if (!attached) return
      attached = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('astro:after-swap', onAfterSwap)
      document.removeEventListener('baseet:section-progress', onSectionProgress)
    },
    tick,
    getProgress: getScrollProgress,
    reset() {
      lastProgress = -1
    },
  }
}
