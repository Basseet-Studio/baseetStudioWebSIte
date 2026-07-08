import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initFeatureMediaScrub, killTriggers } from '../feature-showcase'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  destroy()

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

  const hoverCards = gsap.utils.toArray<HTMLElement>(
    '.moneybox-bento__card, .moneybox-pin__goal, .moneybox-download-card'
  )
  hoverCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.03, duration: 0.4, ease: 'power2.out' })
    })
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.4, ease: 'power2.out' })
    })
  })

  scrollTriggers.push(...initFeatureMediaScrub())

  const marquee = document.querySelector<HTMLElement>('[data-moneybox-marquee]')
  const track = marquee?.querySelector<HTMLElement>('[data-moneybox-marquee-track]')
  if (track) {
    const width = track.scrollWidth / 2
    const tween = gsap.to(track, { x: -width, duration: 28, ease: 'none', repeat: -1 })
    scrollTriggers.push({ kill: () => tween.kill() } as ScrollTrigger)
  }
}

export function destroy(): void {
  killTriggers(scrollTriggers)
  scrollTriggers = []
}
