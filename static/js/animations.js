// Enhanced animations and interactions for Baseet Studio

document.addEventListener('DOMContentLoaded', function () {
  // Initialize all enhancements
  initScrollAnimations()
  initSmoothScrolling()
})

// Scroll animations with intersection observer
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
      }
    })
  }, observerOptions)

  // Observe all animation elements
  const animateSelectors = [
    '.scroll-animate',
    '.scroll-animate-left',
    '.scroll-animate-right',
    '.scroll-animate-scale',
    '.scroll-animate-fade',
    '.scroll-animate-slide-up',
  ]

  animateSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      observer.observe(el)
    })
  })
}

// Enhanced smooth scroll for anchor links
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href')

      // Skip if it's just "#" or empty
      if (!href || href === '#' || href === '#ZgotmplZ') {
        e.preventDefault()
        return
      }

      const targetId = href.substring(1)
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        e.preventDefault()

        // Smooth scroll to target
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })

        // Update URL without page jump
        if (history.pushState) {
          history.pushState(null, null, href)
        }
      }
    })
  })
}
