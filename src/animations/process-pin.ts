// process-pin.ts — Lateral pin indicator for the services "How we work" section.
// Adapted from docs/refrences/Lateral Pin Indicator/ for six steps + mobile.

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let timeline: gsap.core.Timeline | null = null
let themeObserver: MutationObserver | null = null

function refreshPin(): void {
  ScrollTrigger.refresh()
}

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isMobile(): boolean {
  return window.matchMedia('(max-width: 720px)').matches
}

function setActiveStep(
  listItems: HTMLElement[],
  slides: HTMLElement[],
  index: number,
): void {
  listItems.forEach((item, i) => {
    const active = i === index
    item.classList.toggle('is-active', active)
    item.setAttribute('aria-current', active ? 'step' : 'false')
  })
  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i === index ? 'false' : 'true')
  })
}

function getPinStartOffset(): number {
  const bar = document.querySelector<HTMLElement>('.app-bar')
  if (!bar) return 100
  return Math.ceil(bar.getBoundingClientRect().bottom + 12)
}

export function init(): void {
  const root = document.querySelector<HTMLElement>('[data-process-pin]')
  if (!root || isReducedMotion()) return

  const pinSection = root.querySelector<HTMLElement>('.process-pin__pin')
  const listItems = gsap.utils.toArray<HTMLElement>('.process-pin__list-item', root)
  const slides = gsap.utils.toArray<HTMLElement>('.process-pin__slide', root)
  const fill = root.querySelector<HTMLElement>('.process-pin__fill')

  if (!pinSection || listItems.length === 0 || slides.length === 0) return

  const stepCount = listItems.length
  const scrollPerStep = isMobile() ? 60 : 80

  setActiveStep(listItems, slides, 0)
  slides.forEach((slide, i) => {
    gsap.set(slide, { autoAlpha: i === 0 ? 1 : 0 })
  })
  if (fill) {
    gsap.set(fill, {
      scaleY: 1 / stepCount,
      transformOrigin: 'top',
    })
  }

  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: pinSection,
      start: () => `top ${getPinStartOffset()}px`,
      end: `+=${stepCount * scrollPerStep}%`,
      pin: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })

  listItems.forEach((item, i) => {
    if (i === 0) return

    const previousSlide = slides[i - 1]
    const slide = slides[i]

    timeline!
      .add(() => setActiveStep(listItems, slides, i), 0.5 * i)
      .to(slide, { autoAlpha: 1, duration: 0.2 }, '<')
      .to(previousSlide, { autoAlpha: 0, duration: 0.2 }, '<')
  })

  if (fill && timeline) {
    timeline.to(
      fill,
      {
        scaleY: 1,
        transformOrigin: 'top',
        ease: 'none',
        duration: timeline.duration(),
      },
      0,
    )
  }

  timeline.to({}, { duration: 0.05 })

  themeObserver = new MutationObserver(refreshPin)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  window.addEventListener('resize', refreshPin)
}

export function destroy(): void {
  window.removeEventListener('resize', refreshPin)
  themeObserver?.disconnect()
  themeObserver = null

  if (timeline) {
    timeline.scrollTrigger?.kill()
    timeline.kill()
    timeline = null
  }

  ScrollTrigger.getAll().forEach((st) => {
    const trigger = st.vars.trigger
    if (trigger instanceof Element && trigger.closest('[data-process-pin]')) {
      st.kill()
    }
  })
}
