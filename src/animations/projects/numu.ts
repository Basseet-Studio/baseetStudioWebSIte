import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

function splitWords(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent || ''
  el.textContent = ''
  const spans: HTMLSpanElement[] = []
  text.split(/\s+/).forEach((word, i) => {
    const span = document.createElement('span')
    span.className = 'numu-scrub__word'
    span.textContent = word
    span.style.display = 'inline-block'
    span.style.marginRight = '0.3em'
    el.appendChild(span)
    spans.push(span)
    if (i < text.split(/\s+/).length - 1) el.appendChild(document.createTextNode(' '))
  })
  return spans
}

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const scrubEl = document.querySelector<HTMLElement>('[data-numu-scrub]')
  if (scrubEl && !scrubEl.dataset.split) {
    scrubEl.dataset.split = 'true'
    const words = splitWords(scrubEl)
    const st = ScrollTrigger.create({
      trigger: scrubEl,
      start: 'top 80%',
      end: 'bottom 40%',
      scrub: true,
      onUpdate: (self) => {
        const total = words.length
        words.forEach((word, i) => {
          const threshold = (i + 1) / total
          word.style.opacity = self.progress >= threshold * 0.85 ? '1' : '0.15'
        })
      },
    })
    scrollTriggers.push(st)
  }

  const stack = document.querySelector<HTMLElement>('[data-numu-stack]')
  if (stack) {
    const cards = gsap.utils.toArray<HTMLElement>('[data-numu-stack-card]')
    cards.forEach((card, i) => {
      gsap.set(card, { y: i * 24, scale: 1 - i * 0.04, zIndex: cards.length - i })
    })
    const st = ScrollTrigger.create({
      trigger: stack,
      start: 'top 70%',
      end: 'bottom 30%',
      scrub: true,
      onUpdate: (self) => {
        cards.forEach((card, i) => {
          const offset = self.progress * (i + 1) * 40
          gsap.set(card, { y: i * 24 - offset, opacity: 1 - self.progress * i * 0.15 })
        })
      },
    })
    scrollTriggers.push(st)
  }

  const mediaEls = gsap.utils.toArray<HTMLElement>('[data-feature-media]')
  mediaEls.forEach((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      end: 'bottom 20%',
      scrub: true,
      onUpdate: (self) => {
        const scale = 0.85 + self.progress * 0.15
        gsap.set(el, { scale, opacity: 0.4 + self.progress * 0.6 })
      },
    })
    scrollTriggers.push(st)
  })

  const marquee = document.querySelector<HTMLElement>('[data-numu-marquee]')
  const track = marquee?.querySelector<HTMLElement>('[data-numu-marquee-track]')
  if (track) {
    const width = track.scrollWidth / 2
    const tween = gsap.to(track, { x: -width, duration: 25, ease: 'none', repeat: -1 })
    scrollTriggers.push({ kill: () => tween.kill() } as ScrollTrigger)
  }
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
