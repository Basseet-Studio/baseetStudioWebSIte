import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function splitWords(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent || ''
  el.textContent = ''
  const spans: HTMLSpanElement[] = []
  const words = text.split(/\s+/).filter(Boolean)

  words.forEach((word, i) => {
    const span = document.createElement('span')
    span.className = 'scrub-text__word'
    span.textContent = word
    span.style.display = 'inline-block'
    span.style.marginRight = '0.28em'
    el.appendChild(span)
    spans.push(span)
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '))
  })

  return spans
}

/** Scroll-scrub scale/opacity on [data-feature-media] elements */
export function initFeatureMediaScrub(root: ParentNode = document): ScrollTrigger[] {
  if (isReducedMotion()) return []

  const triggers: ScrollTrigger[] = []
  const mediaEls = gsap.utils.toArray<HTMLElement>('[data-feature-media]', root)

  mediaEls.forEach((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      end: 'bottom 20%',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress
        const scale = 0.82 + p * 0.18
        const opacity = p < 0.75 ? 0.35 + p * 0.87 : 1.0 - (p - 0.75) * 3
        gsap.set(el, {
          scale,
          opacity: Math.max(0.25, Math.min(1, opacity)),
        })
      },
    })
    triggers.push(st)
  })

  return triggers
}

/** Word-by-word opacity scrub on elements matching selector */
export function initScrubText(selector: string, root: ParentNode = document): ScrollTrigger | null {
  if (isReducedMotion()) return null

  const scrubEl = root.querySelector<HTMLElement>(selector)
  if (!scrubEl || scrubEl.dataset.scrubSplit === 'true') return null

  scrubEl.dataset.scrubSplit = 'true'
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
        word.style.opacity = self.progress >= threshold * 0.85 ? '1' : '0.12'
      })
    },
  })

  return st
}

export function killTriggers(triggers: ScrollTrigger[]): void {
  triggers.forEach((t) => t.kill())
}
