import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const pinSection = document.querySelector<HTMLElement>('[data-geeb-pin]')
  const pinTitle = document.querySelector<HTMLElement>('[data-geeb-pin-title]')
  const pinContent = document.querySelector<HTMLElement>('[data-geeb-pin-content]')

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

  const mediaEls = gsap.utils.toArray<HTMLElement>('[data-feature-media]')
  mediaEls.forEach((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      end: 'bottom 20%',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress
        const scale = 0.8 + p * 0.2
        const opacity = p < 0.7 ? 0.3 + p * 1.0 : 1.0 - (p - 0.7) * 2.5
        gsap.set(el, { scale, opacity: Math.max(0.2, Math.min(1, opacity)) })
      },
    })
    scrollTriggers.push(st)
  })

  const marquee = document.querySelector<HTMLElement>('[data-geeb-marquee]')
  if (marquee) {
    const track = marquee.querySelector<HTMLElement>('[data-geeb-marquee-track]')
    if (track) {
      const width = track.scrollWidth / 2
      const tween = gsap.to(track, {
        x: -width,
        duration: 30,
        ease: 'none',
        repeat: -1,
      })
      scrollTriggers.push({
        kill: () => tween.kill(),
      } as ScrollTrigger)
    }
  }
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
