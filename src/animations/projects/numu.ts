import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const cards = gsap.utils.toArray<HTMLElement>('#features .glass-card, .feature-card, .content-card')
  if (cards.length) {
    const cardsSt = ScrollTrigger.create({
      trigger: '#features',
      start: 'top 85%',
      onEnter: () => {
        gsap.fromTo(
          cards,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: 'elastic.out(1, 0.5)' }
        )
      },
      once: true,
    })
    scrollTriggers.push(cardsSt)
  }

  const cta = document.querySelector<HTMLElement>('.cta-button, .project-cta a, .cta-section a')
  if (cta) {
    const ctaSt = ScrollTrigger.create({
      trigger: cta,
      start: 'top 90%',
      onEnter: () => {
        const pulse = gsap.to(cta, {
          scale: 1.04,
          duration: 0.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: 2,
        })

        gsap.fromTo(
          cta,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', onComplete: () => pulse.play() }
        )
      },
      once: true,
    })
    scrollTriggers.push(ctaSt)
  }
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
