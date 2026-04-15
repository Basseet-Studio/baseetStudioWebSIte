/* gsap-chopshop.js — Slide-from-edges for alternating feature rows */
;(function () {
  'use strict'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    // Alternating slide-from-edges for feature rows
    var rows = gsap.utils.toArray('.feature-row, [data-gsap="slide-edges"]')
    rows.forEach(function (row, i) {
      var fromX = i % 2 === 0 ? -80 : 80
      // Respect RTL direction
      if (document.documentElement.dir === 'rtl' || document.querySelector('[dir="rtl"]')) {
        fromX = -fromX
      }
      gsap.set(row, { x: fromX, opacity: 0 })
      ScrollTrigger.create({
        trigger: row,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(row, {
            x: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
          })
        },
      })
    })

    // Step flow — stagger appearance
    var steps = gsap.utils.toArray('.steps-flow .step-item, .steps-flow > div')
    if (steps.length) {
      gsap.set(steps, { y: 40, opacity: 0 })
      ScrollTrigger.batch(steps, {
        onEnter: function (batch) {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.15,
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
