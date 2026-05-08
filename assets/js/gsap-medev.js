/* gsap-medev.js — Typewriter reveal + glitch shift (Matrix-style) */
;(function () {
  'use strict'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    // Glitch shift on section headings
    var headings = gsap.utils.toArray('.project-medev section h2')
    headings.forEach(function (h2) {
      ScrollTrigger.create({
        trigger: h2,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          var tl = gsap.timeline()
          tl.fromTo(
            h2,
            { x: -8, opacity: 0, skewX: -4 },
            { x: 0, opacity: 1, skewX: 0, duration: 0.15, ease: 'power2.out' }
          )
            .to(h2, { x: 3, duration: 0.05, ease: 'none' })
            .to(h2, { x: -2, duration: 0.05, ease: 'none' })
            .to(h2, { x: 0, duration: 0.1, ease: 'power2.out' })
        },
      })
    })

    // Fade-in for tab content and integration cards
    var cards = gsap.utils.toArray('.project-medev .tab-content, .project-medev .integration-card')
    if (cards.length) {
      gsap.set(cards, { y: 30, opacity: 0 })
      ScrollTrigger.batch(cards, {
        onEnter: function (batch) {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
          })
        },
        start: 'top 85%',
        once: true,
      })
    }

    // Fade-in for hero elements
    var heroElements = gsap.utils.toArray('.project-medev section:first-of-type h1, .project-medev section:first-of-type p, .project-medev section:first-of-type .status-badge')
    if (heroElements.length) {
      gsap.set(heroElements, { y: 20, opacity: 0 })
      gsap.to(heroElements, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2,
      })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()