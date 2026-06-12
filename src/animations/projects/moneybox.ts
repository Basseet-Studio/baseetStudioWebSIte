import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const cards = gsap.utils.toArray<HTMLElement>('#features .glass-card, .feature-card, .grid-card')
  if (!cards.length) return

  const container = document.querySelector<HTMLElement>('#features')
  if (!container) return

  const style = getComputedStyle(container)
  const columns = style.gridTemplateColumns ? style.gridTemplateColumns.split(' ').length : 3

  const st = ScrollTrigger.create({
    trigger: container,
    start: 'top 85%',
    onEnter: () => {
      cards.forEach((card, i) => {
        const row = Math.floor(i / columns)
        const col = i % columns
        const staggerDelay = (row + col) * 0.08

        gsap.fromTo(
          card,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, delay: staggerDelay, ease: 'power2.out' }
        )
      })
    },
    once: true,
  })

  scrollTriggers.push(st)
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
