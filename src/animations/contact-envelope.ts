// contact-envelope.ts — Subtle paper flop for the contact letter.
// Pointer-driven tilt (like holding a postcard) plus a very gentle idle
// sway. No stamp shake, no whole-envelope wobble keyframes.

import gsap from 'gsap'

let envelope: HTMLElement | null = null
let idleTween: gsap.core.Tween | null = null
let moveHandler: ((e: PointerEvent) => void) | null = null
let leaveHandler: (() => void) | null = null

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function startIdle(): void {
  if (!envelope || isReducedMotion()) return
  idleTween?.kill()
  idleTween = gsap.to(envelope, {
    rotationZ: 0.35,
    y: -3,
    duration: 5.5,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    transformOrigin: '50% 30%',
  })
}

function pauseIdle(): void {
  idleTween?.pause()
}

function resumeIdle(): void {
  if (!idleTween) {
    startIdle()
    return
  }
  idleTween.play()
}

export function init(): void {
  destroy()
  if (isReducedMotion()) return

  envelope = document.querySelector<HTMLElement>('.contact-form__envelope')
  if (!envelope) return

  gsap.set(envelope, {
    transformPerspective: 1100,
    transformStyle: 'preserve-3d',
    transformOrigin: '50% 35%',
  })

  moveHandler = (e: PointerEvent) => {
    if (!envelope) return
    pauseIdle()
    const rect = envelope.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height * 0.35
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)

    gsap.to(envelope, {
      rotationY: dx * 5,
      rotationX: -dy * 3.5,
      rotationZ: dx * 0.4,
      y: -4,
      duration: 0.9,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  leaveHandler = () => {
    if (!envelope) return
    gsap.to(envelope, {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      y: 0,
      duration: 1.4,
      ease: 'power3.out',
      onComplete: resumeIdle,
    })
  }

  envelope.addEventListener('pointermove', moveHandler)
  envelope.addEventListener('pointerleave', leaveHandler)
  startIdle()
}

export function destroy(): void {
  idleTween?.kill()
  idleTween = null

  if (envelope && moveHandler) {
    envelope.removeEventListener('pointermove', moveHandler)
  }
  if (envelope && leaveHandler) {
    envelope.removeEventListener('pointerleave', leaveHandler)
  }

  if (envelope) {
    gsap.killTweensOf(envelope)
    gsap.set(envelope, { clearProps: 'transform' })
  }

  envelope = null
  moveHandler = null
  leaveHandler = null
}
