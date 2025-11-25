/**
 * Performance Optimization Utilities
 * Improves page load speed, animations, and user experience
 */

;(function () {
  'use strict'

  // Debug flag: logs are allowed when running locally or when window.__DEBUG__ is set
  const isDebug =
    typeof window !== 'undefined' &&
    (window.__DEBUG__ || ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(window.location.hostname))

  // ============================================
  // 1. LAZY LOADING ENHANCEMENT
  // ============================================

  // Enhance native lazy loading with intersection observer fallback
  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    const images = document.querySelectorAll('img[loading="lazy"]')
    images.forEach((img) => {
      img.addEventListener('load', function () {
        this.classList.add('loaded')
      })
    })
  } else {
    // Fallback for older browsers
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          img.classList.add('loaded')
          observer.unobserve(img)
        }
      })
    })

    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      imageObserver.observe(img)
    })
  }

  // ============================================
  // 2. DEBOUNCED SCROLL HANDLER
  // ============================================

  let scrollTimeout
  let lastScrollY = window.scrollY

  function handleOptimizedScroll() {
    const currentScrollY = window.scrollY
    const scrollDelta = Math.abs(currentScrollY - lastScrollY)

    // Only trigger if scroll delta is significant (>5px)
    if (scrollDelta > 5) {
      document.body.classList.toggle('scrolling-down', currentScrollY > lastScrollY)
      document.body.classList.toggle('scrolling-up', currentScrollY < lastScrollY)
      lastScrollY = currentScrollY
    }

    // Clear scrolling state after inactivity
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      document.body.classList.remove('scrolling-down', 'scrolling-up')
    }, 150)
  }

  // Use passive event listener for better scroll performance
  window.addEventListener('scroll', handleOptimizedScroll, { passive: true })

  // ============================================
  // 3. PRELOAD CRITICAL RESOURCES
  // ============================================

  function preloadCriticalAssets() {
    // Preload images in viewport
    const criticalImages = document.querySelectorAll('img[fetchpriority="high"]')
    criticalImages.forEach((img) => {
      if (img.complete) return

      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = img.src
      document.head.appendChild(link)
    })
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadCriticalAssets)
  } else {
    preloadCriticalAssets()
  }

  // ============================================
  // 4. REDUCE LAYOUT SHIFTS (CLS)
  // ============================================

  function reserveImageSpace() {
    const images = document.querySelectorAll('img:not([width]):not([height])')
    images.forEach((img) => {
      if (img.naturalWidth && img.naturalHeight) {
        img.setAttribute('width', img.naturalWidth)
        img.setAttribute('height', img.naturalHeight)
      }
    })
  }

  window.addEventListener('load', reserveImageSpace)

  // ============================================
  // 5. OPTIMIZE ANIMATIONS ON LOW-END DEVICES
  // ============================================

  function detectPerformance() {
    // Check if device prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion')
      return
    }

    // Estimate device performance (simple heuristic)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')
    const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4

    if (isSlowConnection || isLowMemory) {
      document.body.classList.add('reduced-animations')
    }
  }

  detectPerformance()

  // ============================================
  // 6. SMOOTH ANCHOR SCROLLING
  // ============================================

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href')
      if (href === '#') return

      const target = document.querySelector(href)
      if (target) {
        e.preventDefault()
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })

        // Update URL without triggering navigation
        if (history.pushState) {
          history.pushState(null, null, href)
        }
      }
    })
  })

  // ============================================
  // 7. PREFETCH ON HOVER (NEXT PAGE)
  // ============================================

  const prefetchedLinks = new Set()

  function prefetchLink(url) {
    if (prefetchedLinks.has(url)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
    prefetchedLinks.add(url)
  }

  // Prefetch links on hover (with delay to avoid over-prefetching)
  let hoverTimeout
  document.querySelectorAll('a[href^="/"], a[href^="http"]').forEach((link) => {
    link.addEventListener('mouseenter', function () {
      hoverTimeout = setTimeout(() => {
        const url = this.href
        if (url && !url.includes('#')) {
          prefetchLink(url)
        }
      }, 200)
    })

    link.addEventListener('mouseleave', function () {
      clearTimeout(hoverTimeout)
    })
  })

  // ============================================
  // 8. MONITOR PERFORMANCE METRICS
  // ============================================

  if ('PerformanceObserver' in window) {
    // Monitor Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (isDebug) console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime)
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // Monitor Cumulative Layout Shift (CLS)
    let clsScore = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value
        }
      }
      if (isDebug) console.log('CLS:', clsScore)
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })

    // Monitor First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (isDebug) console.log('FID:', entry.processingStart - entry.startTime)
      }
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
  }

  // ============================================
  // 9. OPTIMIZE THIRD-PARTY SCRIPTS
  // ============================================

  // Defer non-critical third-party scripts
  window.addEventListener('load', () => {
    // Add third-party scripts here after page load
    // Example: Analytics, chat widgets, etc.
  })

  if (isDebug) console.log('✨ Performance optimizations loaded')
})()
