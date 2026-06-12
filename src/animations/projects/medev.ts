import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const cards = gsap.utils.toArray<HTMLElement>('#features .glass-card')
  if (!cards.length) return

  const oddCards: HTMLElement[] = []
  const evenCards: HTMLElement[] = []

  cards.forEach((card, i) => {
    if (i % 2 === 0) {
      oddCards.push(card)
    } else {
      evenCards.push(card)
    }
  })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#features',
      start: 'top 85%',
      once: true,
    },
  })

  tl.fromTo(
    oddCards,
    { x: -60, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' },
    0
  )

  tl.fromTo(
    evenCards,
    { x: 60, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' },
    0.04
  )

  scrollTriggers.push(tl.scrollTrigger as ScrollTrigger)
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
