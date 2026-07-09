import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initFeatureMediaScrub, killTriggers } from '../feature-showcase'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initTimelineStagger(root: ParentNode = document): void {
  const steps = gsap.utils.toArray<HTMLElement>('[data-client-timeline-step]', root)
  steps.forEach((step, i) => {
    gsap.set(step, { opacity: 0, y: 24 })
    const st = ScrollTrigger.create({
      trigger: step,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(step, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          delay: i * 0.06,
          ease: 'power2.out',
        })
      },
    })
    scrollTriggers.push(st)
  })
}

function initStackScrub(root: ParentNode = document): void {
  const stack = root.querySelector<HTMLElement>('[data-client-stack]')
  if (!stack) return

  const cards = gsap.utils.toArray<HTMLElement>('[data-client-stack-card]', stack)
  if (cards.length === 0) return

  cards.forEach((card, i) => {
    gsap.set(card, { y: i * 20, scale: 1 - i * 0.03, zIndex: cards.length - i })
  })

  const st = ScrollTrigger.create({
    trigger: stack,
    start: 'top 75%',
    end: 'bottom 25%',
    scrub: true,
    onUpdate: (self) => {
      cards.forEach((card, i) => {
        const offset = self.progress * (i + 1) * 32
        gsap.set(card, {
          y: i * 20 - offset,
          opacity: 1 - self.progress * i * 0.12,
        })
      })
    },
  })
  scrollTriggers.push(st)
}

export function init(): void {
  if (isReducedMotion()) return

  destroy()

  scrollTriggers.push(...initFeatureMediaScrub())
  initTimelineStagger()
  initStackScrub()
}

export function destroy(): void {
  killTriggers(scrollTriggers)
  scrollTriggers = []
}
