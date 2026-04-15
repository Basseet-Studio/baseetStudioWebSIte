/* gsap-numu.js — Elastic bounce-in for carousel items */
;(function () {
  'use strict'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    // Elastic bounce-in for feature carousel cards
    var carouselCards = gsap.utils.toArray('.carousel-card')
    if (carouselCards.length) {
      gsap.set(carouselCards, { scale: 0, opacity: 0 })
      ScrollTrigger.batch(carouselCards, {
        onEnter: function (batch) {
          gsap.to(batch, {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'elastic.out(1, 0.5)',
          })
        },
        start: 'top 85%',
        once: true,
      })
    }

    // Fade-up for testimonial cards
    var testimonials = gsap.utils.toArray('.project-numu .testimonial-card, .project-numu blockquote')
    if (testimonials.length) {
      gsap.set(testimonials, { y: 40, opacity: 0 })
      ScrollTrigger.batch(testimonials, {
        onEnter: function (batch) {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: 'back.out(1.2)',
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
