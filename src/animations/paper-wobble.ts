// paper-wobble.ts — Subtle GSAP "breathing" animation for paper surfaces.
// Adds gentle rotation + scale on elements with [data-paper-wobble].
// Combined with the static SVG paper filter (PaperFilters.astro), this
// gives the paper a "floating in still air" feel without re-resolving
// the filter graph every frame (which is what GSAP would do if we tried
// to tween the filter attributes directly).
//
// Lifecycle: init() / destroy() mirror the pattern in global.ts so
// view-transition navigations can re-run it cleanly.

import gsap from 'gsap'

const animated = new WeakSet<Element>()
let activeTweens: gsap.core.Tween[] = []

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function wobble(): void {
  if (isReducedMotion()) return

  document.querySelectorAll('[data-paper-wobble]').forEach((el) => {
    if (animated.has(el)) return
    animated.add(el)

    const t = gsap.to(el, {
      rotate: '+=0.6',
      scale: 1.002,
      duration: 7,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
    activeTweens.push(t)
  })
}

function killTweens(): void {
  activeTweens.forEach((t) => t.kill())
  activeTweens = []
}

export function init(): void {
  wobble()
}

export function destroy(): void {
  killTweens()
}
