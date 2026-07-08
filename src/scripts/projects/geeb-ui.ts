export function initBookingCycle(): () => void {
  const root = document.querySelector('[data-geeb-booking]')
  if (!root) return () => {}

  const states = root.querySelectorAll<HTMLElement>('[data-geeb-booking-state]')
  const dots = root.querySelectorAll('.geeb-booking__dots span')
  if (states.length === 0) return () => {}

  let current = 0
  let intervalId: ReturnType<typeof setInterval> | undefined

  function showState(index: number) {
    states.forEach((s, i) => s.classList.toggle('is-active', i === index))
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index))
    current = index
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showState(0)
    return () => {}
  }

  showState(0)
  intervalId = setInterval(() => {
    showState((current + 1) % states.length)
  }, 4000)

  return () => {
    if (intervalId) clearInterval(intervalId)
  }
}

export function initAppSwitcher(): () => void {
  const root = document.querySelector('[data-geeb-switcher]')
  if (!root) return () => {}

  const tabs = root.querySelectorAll<HTMLButtonElement>('[data-geeb-switcher-tab]')
  const panels = root.querySelectorAll<HTMLElement>('[data-geeb-switcher-panel]')
  if (tabs.length === 0) return () => {}

  const tabIds = Array.from(tabs).map((t) => t.getAttribute('data-geeb-switcher-tab') ?? '')
  let current = 0
  let intervalId: ReturnType<typeof setInterval> | undefined

  function activate(id: string) {
    tabs.forEach((tab) => {
      const isActive = tab.getAttribute('data-geeb-switcher-tab') === id
      tab.classList.toggle('is-active', isActive)
      tab.setAttribute('aria-selected', String(isActive))
    })
    panels.forEach((panel) => {
      const isActive = panel.getAttribute('data-geeb-switcher-panel') === id
      panel.classList.toggle('is-active', isActive)
      if (isActive) panel.removeAttribute('hidden')
      else panel.setAttribute('hidden', '')
    })
    current = tabIds.indexOf(id)
  }

  const clickHandlers: Array<{ el: HTMLButtonElement; fn: () => void }> = []
  tabs.forEach((tab) => {
    const fn = () => {
      const id = tab.getAttribute('data-geeb-switcher-tab')
      if (id) {
        activate(id)
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = undefined
        }
      }
    }
    tab.addEventListener('click', fn)
    clickHandlers.push({ el: tab, fn })
  })

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intervalId = setInterval(() => {
      activate(tabIds[(current + 1) % tabIds.length])
    }, 5000)
  }

  return () => {
    if (intervalId) clearInterval(intervalId)
    clickHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn))
  }
}

export function initPipelineStepper(): () => void {
  const root = document.querySelector('[data-geeb-pipeline]')
  if (!root) return () => {}

  const steps = root.querySelectorAll<HTMLElement>('[data-geeb-pipeline-step]')
  if (steps.length === 0) return () => {}

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    steps.forEach((s) => s.classList.add('is-active'))
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-active')
        }
      })
    },
    { threshold: 0.5, rootMargin: '-10% 0px' },
  )

  steps.forEach((step) => observer.observe(step))

  return () => observer.disconnect()
}
