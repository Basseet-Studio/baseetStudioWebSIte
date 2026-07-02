// Inline theme bootstrap — mirrors src/lib/theme.ts (keep in sync).
(function () {
  var STORAGE_KEY = 'baseet-theme'
  var NIGHT_LUM = 0.42
  var ANCHOR_NIGHT = 0
  var ANCHOR_BRIGHT = 4.5
  var ANCHOR_DAY = 14
  var ANCHOR_DARK = 20

  function lerp(a, b, t) { return a + (b - a) * t }
  function lerpRGB(a, b, t) {
    return {
      r: Math.round(lerp(a.r, b.r, t)),
      g: Math.round(lerp(a.g, b.g, t)),
      b: Math.round(lerp(a.b, b.b, t)),
    }
  }
  function mapRange(v, min, max) { return max === min ? 0 : (v - min) / (max - min) }

  var night = { r: 10, g: 18, b: 39 }
  var dawn = { r: 243, g: 164, b: 111 }
  var day = { r: 135, g: 206, b: 235 }
  var dusk = { r: 89, g: 105, b: 176 }

  function legacySky(hour) {
    var h = Math.max(0, Math.min(24, hour))
    if (h < 6) return lerpRGB(night, dawn, mapRange(h, 0, 6))
    if (h < 12) return lerpRGB(dawn, day, mapRange(h, 6, 12))
    if (h < 18) return lerpRGB(day, dusk, mapRange(h, 12, 18))
    return lerpRGB(dusk, night, mapRange(h, 18, 24))
  }

  var anchors = {
    night: legacySky(ANCHOR_NIGHT),
    bright: legacySky(ANCHOR_BRIGHT),
    day: legacySky(ANCHOR_DAY),
    dark: legacySky(ANCHOR_DARK),
  }

  function skyForHour(hour) {
    var h = Math.max(0, Math.min(24, hour))
    if (h < ANCHOR_BRIGHT) return lerpRGB(anchors.night, anchors.bright, mapRange(h, ANCHOR_NIGHT, ANCHOR_BRIGHT))
    if (h < ANCHOR_DAY) return lerpRGB(anchors.bright, anchors.day, mapRange(h, ANCHOR_BRIGHT, ANCHOR_DAY))
    if (h < ANCHOR_DARK) return lerpRGB(anchors.day, anchors.dark, mapRange(h, ANCHOR_DAY, ANCHOR_DARK))
    return lerpRGB(anchors.dark, anchors.night, mapRange(h, ANCHOR_DARK, 24))
  }

  function luminance(rgb) {
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  }

  function themeForHour(hour) {
    return luminance(skyForHour(hour)) < NIGHT_LUM ? 'night' : 'day'
  }

  var theme = 'day'
  try {
    var saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'day' || saved === 'night') {
      theme = saved
    } else {
      var now = new Date()
      var hour = now.getHours() + now.getMinutes() / 60
      theme = themeForHour(hour)
    }
  } catch (e) {}

  document.documentElement.setAttribute('data-theme', theme)
})()
