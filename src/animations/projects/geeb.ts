import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initScrubText, killTriggers } from '../feature-showcase'
import { initBookingCycle, initAppSwitcher, initPipelineStepper } from '../../scripts/projects/geeb-ui'

gsap.registerPlugin(ScrollTrigger)

let scrollTriggers: ScrollTrigger[] = []
let cleanups: Array<() => void> = []

export function init(): void {
  destroy()

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!reducedMotion) {
    const scrubSt = initScrubText('[data-geeb-scrub]')
    if (scrubSt) scrollTriggers.push(scrubSt)

    const timeline = document.querySelector('[data-geeb-timeline]')
    if (timeline) {
      const items = timeline.querySelectorAll('[data-geeb-timeline-item]')
      const tlSt = ScrollTrigger.create({
        trigger: timeline,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(
            items,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' },
          )
        },
        once: true,
      })
      scrollTriggers.push(tlSt)
    }

    const marquee = document.querySelector<HTMLElement>('[data-geeb-marquee]')
    if (marquee) {
      const track = marquee.querySelector<HTMLElement>('[data-geeb-marquee-track]')
      if (track) {
        const width = track.scrollWidth / 2
        const tween = gsap.to(track, {
          x: -width,
          duration: 35,
          ease: 'none',
          repeat: -1,
        })
        scrollTriggers.push({
          kill: () => tween.kill(),
        } as ScrollTrigger)
      }
    }
  }

  cleanups.push(initBookingCycle())
  cleanups.push(initAppSwitcher())
  cleanups.push(initPipelineStepper())
}

export function destroy(): void {
  killTriggers(scrollTriggers)
  scrollTriggers = []
  cleanups.forEach((fn) => fn())
  cleanups = []
}
