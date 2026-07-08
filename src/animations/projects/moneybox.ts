import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const pinSection = document.querySelector<HTMLElement>('[data-moneybox-pin]')
  const pinTitle = document.querySelector<HTMLElement>('[data-moneybox-pin-title]')
  const pinContent = document.querySelector<HTMLElement>('[data-moneybox-pin-content]')

  if (pinSection && pinTitle && pinContent) {
    const pinSt = ScrollTrigger.create({
      trigger: pinSection,
      start: 'top top',
      end: () => `+=${pinContent.offsetHeight}`,
      pin: pinTitle,
      pinSpacing: false,
      anticipatePin: 1,
    })
    scrollTriggers.push(pinSt)
  }

  const hoverCards = gsap.utils.toArray<HTMLElement>('.moneybox-bento__card, .moneybox-pin__goal, .moneybox-download-card')
  hoverCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.03, duration: 0.4, ease: 'power2.out' })
    })
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.4, ease: 'power2.out' })
    })
  })

  const mediaEls = gsap.utils.toArray<HTMLElement>('[data-feature-media]')
  mediaEls.forEach((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      scrub: true,
      onUpdate: (self) => {
        gsap.set(el, { scale: 0.85 + self.progress * 0.15, opacity: 0.4 + self.progress * 0.6 })
      },
    })
    scrollTriggers.push(st)
  })
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
