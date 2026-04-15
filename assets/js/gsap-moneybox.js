/* gsap-moneybox.js — Staggered card flip + counter roll-up */
;(function () {
  'use strict'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    // Staggered card flip for bento cards
    var cards = gsap.utils.toArray('[data-gsap="stagger-flip"]')
    if (cards.length) {
      gsap.set(cards, { rotateY: 90, opacity: 0 })
      ScrollTrigger.batch(cards, {
        onEnter: function (batch) {
          gsap.to(batch, {
            rotateY: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'back.out(1.4)',
          })
        },
        start: 'top 85%',
        once: true,
      })
    }

    // Counter roll-up for stat numbers
    var counters = gsap.utils.toArray('.counter-value')
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10)
      if (isNaN(target)) return
      var obj = { val: 0 }
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = Math.round(obj.val).toLocaleString()
            },
          })
        },
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
