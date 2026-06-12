import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []

function splitTextIntoSpans(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent || ''
  el.textContent = ''
  const spans: HTMLSpanElement[] = []
  for (const char of text) {
    const span = document.createElement('span')
    span.textContent = char === ' ' ? '\u00A0' : char
    span.style.display = 'inline-block'
    el.appendChild(span)
    spans.push(span)
  }
  return spans
}

export function init(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []

  const heroTitle = document.querySelector<HTMLElement>('.project-hero h1, .project-hero .hero-title')
  if (heroTitle && !heroTitle.dataset.animated) {
    heroTitle.dataset.animated = 'true'
    const chars = splitTextIntoSpans(heroTitle)

    const heroSt = ScrollTrigger.create({
      trigger: heroTitle,
      start: 'top 85%',
      onEnter: () => {
        gsap.fromTo(
          chars,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.03, stagger: 0.04, ease: 'steps(1)' }
        )
      },
      once: true,
    })
    scrollTriggers.push(heroSt)
  }

  const cards = gsap.utils.toArray<HTMLElement>('#features .glass-card, .feature-card, .content-card')
  if (cards.length) {
    const cardsSt = ScrollTrigger.create({
      trigger: '#features',
      start: 'top 85%',
      onEnter: () => {
        cards.forEach((card) => {
          const delay = gsap.utils.random(0, 0.2)

          gsap.fromTo(
            card,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.5,
              delay,
              ease: 'power3.out',
              onStart: () => {
                gsap.to(card, {
                  x: gsap.utils.random(-3, 3),
                  y: gsap.utils.random(-2, 2),
                  duration: 0.05,
                  repeat: 3,
                  yoyo: true,
                  ease: 'steps(2)',
                  onComplete: () => {
                    gsap.set(card, { x: 0, y: 0 })
                  },
                })
              },
            }
          )
        })
      },
      once: true,
    })
    scrollTriggers.push(cardsSt)
  }

  const faqItems = gsap.utils.toArray<HTMLElement>('.faq-item, .faq-section details, .faq-section .faq-entry')
  if (faqItems.length) {
    const faqSt = ScrollTrigger.create({
      trigger: '#faq, .faq-section',
      start: 'top 80%',
      onEnter: () => {
        gsap.fromTo(
          faqItems,
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out' }
        )
      },
      once: true,
    })
    scrollTriggers.push(faqSt)
  }

  document.querySelectorAll<HTMLElement>('.glass-card, .feature-card, .content-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
        borderColor: 'rgba(0, 255, 255, 0.4)',
        duration: 0.3,
        ease: 'power2.out',
      })
    })
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        duration: 0.3,
        ease: 'power2.out',
      })
    })
  })
}

export function destroy(): void {
  scrollTriggers.forEach((t) => t.kill())
  scrollTriggers = []
}
