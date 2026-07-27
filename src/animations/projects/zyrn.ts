import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const cards = gsap.utils.toArray<HTMLElement>(
    '#features .glass-card, .feature-card, .content-card, .zyrn-metrics__tile, .zyrn-tools__item, .zyrn-day__item, .zyrn-packages__card'
  )
  if (!cards.length) return

  cards.forEach((card, i) => {
    const st = ScrollTrigger.create({
      trigger: card,
      start: 'top 88%',
      onEnter: () => {
        gsap.fromTo(
          card,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, delay: (i % 4) * 0.06, ease: 'power2.out' }
        )
      },
      once: true,
    })
    scrollTriggers.push(st)
  })
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
