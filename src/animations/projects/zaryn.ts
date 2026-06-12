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

  const st = ScrollTrigger.create({
    trigger: '#features',
    start: 'top 80%',
    onEnter: () => {
      gsap.fromTo(
        cards,
        { rotateY: 90, y: 40, opacity: 0 },
        {
          rotateY: 0,
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        }
      )
    },
    once: true,
  })

  scrollTriggers.push(st)
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
