/* gsap-baseetims.js — Stagger flip for bento cards */
;(function () {
  'use strict'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    // Stagger flip for bento cards
    var bentoCards = gsap.utils.toArray('.project-baseetims .bento-card')
    if (bentoCards.length) {
      gsap.set(bentoCards, { opacity: 0, y: 40, scale: 0.9 })
      ScrollTrigger.batch(bentoCards, {
        onEnter: function (batch) {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.2)',
          })
        },
        start: 'top 85%',
        once: true,
      })
    }

    // Fade-up for stat cards
    var statCards = gsap.utils.toArray('.project-baseetims .stat-card')
    if (statCards.length) {
      gsap.set(statCards, { y: 30, opacity: 0 })
      ScrollTrigger.batch(statCards, {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()