/**
 * Plain-JS mirror of src/components/background/vanta-init.ts
 * Use this in Toolcraft / preview.html — keep in sync when the site init changes.
 */
(function (global) {
  'use strict'

  let vantaEffect = null
  let initialised = false
  let scrollTicking = false
  let listenersAttached = false

  const ANCHOR_HOUR_NIGHT = 0
  const ANCHOR_HOUR_BRIGHT_SHIFT = 4.5
  const ANCHOR_HOUR_DAY = 14
  const ANCHOR_HOUR_DARK_SHIFT = 20

  const nightTheme = {
    sky: { r: 10, g: 18, b: 39 },
    cloud: { r: 86, g: 104, b: 135 },
    cloudShadow: { r: 6, g: 12, b: 28 },
  }

  const dawnTheme = {
    sky: { r: 243, g: 164, b: 111 },
    cloud: { r: 255, g: 215, b: 191 },
    cloudShadow: { r: 171, g: 118, b: 135 },
  }

  const duskTheme = {
    sky: { r: 89, g: 105, b: 176 },
    cloud: { r: 213, g: 178, b: 194 },
    cloudShadow: { r: 78, g: 73, b: 138 },
  }

  function getCSSVar(name) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim()
      .replace('#', '')
    return parseInt(value, 16)
  }

  function hexToRGB(value) {
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    }
  }

  function rgbToHex(rgb) {
    return (rgb.r << 16) + (rgb.g << 8) + rgb.b
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t)
  }

  function lerpRGB(a, b, t) {
    return {
      r: lerp(a.r, b.r, t),
      g: lerp(a.g, b.g, t),
      b: lerp(a.b, b.b, t),
    }
  }

  function mapRange(value, inMin, inMax) {
    if (inMax === inMin) return 0
    return (value - inMin) / (inMax - inMin)
  }

  function readDefaultThemeFromCss() {
    return {
      sky: hexToRGB(getCSSVar('--vanta-sky')),
      cloud: hexToRGB(getCSSVar('--vanta-cloud')),
      cloudShadow: hexToRGB(getCSSVar('--vanta-cloud-shadow')),
    }
  }

  function getLegacyThemeForHour(hour) {
    const defaultTheme = readDefaultThemeFromCss()
    const clamped = Math.max(0, Math.min(24, hour))

    if (clamped < 6) {
      const t = mapRange(clamped, 0, 6)
      return {
        sky: lerpRGB(nightTheme.sky, dawnTheme.sky, t),
        cloud: lerpRGB(nightTheme.cloud, dawnTheme.cloud, t),
        cloudShadow: lerpRGB(nightTheme.cloudShadow, dawnTheme.cloudShadow, t),
      }
    }

    if (clamped < 12) {
      const t = mapRange(clamped, 6, 12)
      return {
        sky: lerpRGB(dawnTheme.sky, defaultTheme.sky, t),
        cloud: lerpRGB(dawnTheme.cloud, defaultTheme.cloud, t),
        cloudShadow: lerpRGB(dawnTheme.cloudShadow, defaultTheme.cloudShadow, t),
      }
    }

    if (clamped < 18) {
      const t = mapRange(clamped, 12, 18)
      return {
        sky: lerpRGB(defaultTheme.sky, duskTheme.sky, t),
        cloud: lerpRGB(defaultTheme.cloud, duskTheme.cloud, t),
        cloudShadow: lerpRGB(defaultTheme.cloudShadow, duskTheme.cloudShadow, t),
      }
    }

    const t = mapRange(clamped, 18, 24)
    return {
      sky: lerpRGB(duskTheme.sky, nightTheme.sky, t),
      cloud: lerpRGB(duskTheme.cloud, nightTheme.cloud, t),
      cloudShadow: lerpRGB(duskTheme.cloudShadow, nightTheme.cloudShadow, t),
    }
  }

  const lockedAnchors = {
    night: getLegacyThemeForHour(ANCHOR_HOUR_NIGHT),
    brightShift: getLegacyThemeForHour(ANCHOR_HOUR_BRIGHT_SHIFT),
    day: getLegacyThemeForHour(ANCHOR_HOUR_DAY),
    darkShift: getLegacyThemeForHour(ANCHOR_HOUR_DARK_SHIFT),
  }

  function getThemeForHour(hour) {
    const clamped = Math.max(0, Math.min(24, hour))

    if (clamped < ANCHOR_HOUR_BRIGHT_SHIFT) {
      const t = mapRange(clamped, ANCHOR_HOUR_NIGHT, ANCHOR_HOUR_BRIGHT_SHIFT)
      return {
        sky: lerpRGB(lockedAnchors.night.sky, lockedAnchors.brightShift.sky, t),
        cloud: lerpRGB(lockedAnchors.night.cloud, lockedAnchors.brightShift.cloud, t),
        cloudShadow: lerpRGB(
          lockedAnchors.night.cloudShadow,
          lockedAnchors.brightShift.cloudShadow,
          t,
        ),
      }
    }

    if (clamped < ANCHOR_HOUR_DAY) {
      const t = mapRange(clamped, ANCHOR_HOUR_BRIGHT_SHIFT, ANCHOR_HOUR_DAY)
      return {
        sky: lerpRGB(lockedAnchors.brightShift.sky, lockedAnchors.day.sky, t),
        cloud: lerpRGB(lockedAnchors.brightShift.cloud, lockedAnchors.day.cloud, t),
        cloudShadow: lerpRGB(
          lockedAnchors.brightShift.cloudShadow,
          lockedAnchors.day.cloudShadow,
          t,
        ),
      }
    }

    if (clamped < ANCHOR_HOUR_DARK_SHIFT) {
      const t = mapRange(clamped, ANCHOR_HOUR_DAY, ANCHOR_HOUR_DARK_SHIFT)
      return {
        sky: lerpRGB(lockedAnchors.day.sky, lockedAnchors.darkShift.sky, t),
        cloud: lerpRGB(lockedAnchors.day.cloud, lockedAnchors.darkShift.cloud, t),
        cloudShadow: lerpRGB(
          lockedAnchors.day.cloudShadow,
          lockedAnchors.darkShift.cloudShadow,
          t,
        ),
      }
    }

    const t = mapRange(clamped, ANCHOR_HOUR_DARK_SHIFT, 24)
    return {
      sky: lerpRGB(lockedAnchors.darkShift.sky, lockedAnchors.night.sky, t),
      cloud: lerpRGB(lockedAnchors.darkShift.cloud, lockedAnchors.night.cloud, t),
      cloudShadow: lerpRGB(
        lockedAnchors.darkShift.cloudShadow,
        lockedAnchors.night.cloudShadow,
        t,
      ),
    }
  }

  function showFallback() {
    const fallback = document.getElementById('vanta-fallback')
    if (fallback) fallback.style.display = 'block'
  }

  function initOnce() {
    if (initialised) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showFallback()
      return
    }

    const el = document.getElementById('vanta-bg')
    if (!el || typeof global.VANTA === 'undefined') return

    try {
      const now = new Date()
      const initialHour = now.getHours() + now.getMinutes() / 60
      const initialTheme = getThemeForHour(initialHour)

      vantaEffect = global.VANTA.CLOUDS({
        el,
        skyColor: rgbToHex(initialTheme.sky),
        cloudColor: rgbToHex(initialTheme.cloud),
        cloudShadowColor: rgbToHex(initialTheme.cloudShadow),
        speed: 1.0,
        scale: 2,
        mouseEase: true,
      })
      initialised = true
    } catch {
      showFallback()
    }
  }

  function handleResize() {
    if (vantaEffect && typeof vantaEffect.resize === 'function') {
      vantaEffect.resize()
    }
  }

  function applyCloudJourney(progress) {
    const el = document.getElementById('vanta-bg')
    const canvas = document.querySelector('#vanta-bg canvas')
    if (!canvas || !el) return

    const translateY = -progress * 100
    el.style.transform = 'translate3d(0, ' + translateY + 'vh, 0)'
    canvas.style.transition = 'none'
  }

  function handleScroll() {
    if (!vantaEffect) return
    if (scrollTicking) return
    scrollTicking = true

    requestAnimationFrame(function () {
      const scrollMax =
        document.documentElement.scrollHeight - window.innerHeight
      if (scrollMax <= 0) {
        applyCloudJourney(0)
        scrollTicking = false
        return
      }

      const progress = Math.min(window.scrollY / scrollMax, 1.0)
      applyCloudJourney(progress)
      scrollTicking = false
    })
  }

  function handleVisibilityChange() {
    if (!vantaEffect) return
    if (document.hidden) {
      if (typeof vantaEffect.pause === 'function') vantaEffect.pause()
    } else if (typeof vantaEffect.resume === 'function') {
      vantaEffect.resume()
    }
  }

  function setVantaTheme(theme) {
    if (!vantaEffect || typeof vantaEffect.setOptions !== 'function') return
    const hour = theme === 'night' ? ANCHOR_HOUR_NIGHT : ANCHOR_HOUR_DAY
    const themeColors = getThemeForHour(hour)
    vantaEffect.setOptions({
      skyColor: rgbToHex(themeColors.sky),
      cloudColor: rgbToHex(themeColors.cloud),
      cloudShadowColor: rgbToHex(themeColors.cloudShadow),
    })
  }

  function initVanta() {
    initOnce()
    handleScroll()

    if (listenersAttached) return
    listenersAttached = true

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  function destroyVanta() {
    if (vantaEffect && typeof vantaEffect.destroy === 'function') {
      vantaEffect.destroy()
      vantaEffect = null
    }
    initialised = false
    scrollTicking = false
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleScroll)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    listenersAttached = false
  }

  global.BaseetVanta = {
    ANCHOR_HOUR_NIGHT,
    ANCHOR_HOUR_BRIGHT_SHIFT,
    ANCHOR_HOUR_DAY,
    ANCHOR_HOUR_DARK_SHIFT,
    getThemeForHour,
    initVanta,
    destroyVanta,
    setVantaTheme,
    applyCloudJourney,
    lockedAnchors,
  }
})(typeof window !== 'undefined' ? window : globalThis)
