/* gsap-deshikitchen.js — Parallax depth + scale-in masonry */
;(function () {
  'use strict'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    // Parallax depth layers on hero decorative elements
    var heroDecorations = gsap.utils.toArray(
      '.project-deshikitchen .hero-decoration, .project-deshikitchen .spice-icon'
    )
    heroDecorations.forEach(function (el, i) {
      var speed = ((i % 3) + 1) * 0.3
      gsap.to(el, {
        y: function () {
          return -60 * speed
        },
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      })
    })

    // Scale-in for masonry cards
    var masonryCards = gsap.utils.toArray('.masonry-card')
    if (masonryCards.length) {
      gsap.set(masonryCards, { scale: 0.7, opacity: 0 })
      ScrollTrigger.batch(masonryCards, {
        onEnter: function (batch) {
          gsap.to(batch, {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.3)',
          })
        },
        start: 'top 85%',
        once: true,
      })
    }

    // Fade-in for social ticker section
    var ticker = document.querySelector('.social-ticker')
    if (ticker) {
      gsap.set(ticker, { opacity: 0, y: 30 })
      ScrollTrigger.create({
        trigger: ticker,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(ticker, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          })
        },
      })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
