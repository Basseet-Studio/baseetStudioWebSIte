import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const hero = document.querySelector<HTMLElement>('.project-hero')
  if (hero) {
    const heroSt = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      onUpdate: (self) => {
        gsap.set(hero, { backgroundPositionY: `${self.progress * 30}%` })
      },
    })
    scrollTriggers.push(heroSt)
  }

  const images = gsap.utils.toArray<HTMLElement>('.project-gallery img, .gallery-image, #gallery img')
  images.forEach((img) => {
    const st = ScrollTrigger.create({
      trigger: img,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.6,
      onUpdate: (self) => {
        const scale = 0.95 + self.progress * 0.1
        gsap.set(img, { scale })
      },
    })
    scrollTriggers.push(st)
  })
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
