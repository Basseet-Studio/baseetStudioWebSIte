// global.ts — Global GSAP animations with ViewTransitions lifecycle support
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const animatedElements = new Set<string>()
let scrollTriggers: ScrollTrigger[] = []

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function animateElements(): void {
  if (isReducedMotion()) return

  document.querySelectorAll('[data-animate]').forEach((el) => {
    const id = el.getAttribute('data-animate')
    if (id && animatedElements.has(id)) return
    if (id) animatedElements.add(id)

    const animationType = el.getAttribute('data-animate-type') || 'fade-up'

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        el.classList.add('animate-visible')
        gsap.fromTo(
          el,
          animationType === 'fade-up'
            ? { opacity: 0, y: 30 }
            : animationType === 'fade-in'
              ? { opacity: 0 }
              : animationType === 'slide-left'
                ? { opacity: 0, x: -30 }
                : { opacity: 0, scale: 0.95 },
          { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.6, ease: 'power2.out' }
        )
      },
      once: true,
    })
    scrollTriggers.push(st)
  })
}

function destroyAnimations(): void {
  scrollTriggers.forEach((st) => st.kill())
  scrollTriggers = []
  animatedElements.clear()
}

export function init(): void {
  animateElements()
}

export function destroy(): void {
  destroyAnimations()
}
