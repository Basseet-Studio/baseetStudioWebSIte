/* gsap-matrix.js — Typewriter reveal + glitch shift */
;(function () {
  'use strict'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)

    // Typewriter reveal for hero heading
    var heroHeading = document.querySelector('.project-matrix .hero-title, .project-matrix [data-gsap="typewriter"]')
    if (heroHeading) {
      var text = heroHeading.textContent
      heroHeading.textContent = ''
      heroHeading.style.visibility = 'visible'
      var chars = text.split('')
      chars.forEach(function (c) {
        var span = document.createElement('span')
        span.textContent = c
        span.style.opacity = '0'
        heroHeading.appendChild(span)
      })
      var charSpans = heroHeading.querySelectorAll('span')
      gsap.to(charSpans, {
        opacity: 1,
        duration: 0.03,
        stagger: 0.04,
        ease: 'none',
        delay: 0.3,
      })
    }

    // Glitch shift on section headings
    var headings = gsap.utils.toArray('.project-matrix section h2')
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
    var cards = gsap.utils.toArray('.integration-card')
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
