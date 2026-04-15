/* visitor-detect.js — Country & device detection for footer */
;(function () {
  'use strict'

  var CACHE_KEY = 'baseet_visitor_country'
  var TIMEOUT_MS = 3000

  function detectDevice() {
    var ua = navigator.userAgent || ''
    if (/Mobi|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return 'Mobile'
    }
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
      return 'Tablet'
    }
    return 'Desktop'
  }

  function fetchWithTimeout(url, ms) {
    return Promise.race([
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error(r.status)
        return r.json()
      }),
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error('timeout'))
        }, ms)
      }),
    ])
  }

  function detectCountry() {
    var cached = null
    try {
      cached = sessionStorage.getItem(CACHE_KEY)
    } catch (_) {
      /* ignore */
    }
    if (cached) return Promise.resolve(cached)

    return fetchWithTimeout('https://ipapi.co/json/', TIMEOUT_MS)
      .then(function (data) {
        var country = data && data.country_name ? String(data.country_name) : ''
        if (country) {
          try {
            sessionStorage.setItem(CACHE_KEY, country)
          } catch (_) {
            /* ignore */
          }
        }
        return country || ''
      })
      .catch(function () {
        // Fallback API
        return fetchWithTimeout('https://ip-api.com/json/?fields=country', TIMEOUT_MS)
          .then(function (data) {
            var country = data && data.country ? String(data.country) : ''
            if (country) {
              try {
                sessionStorage.setItem(CACHE_KEY, country)
              } catch (_) {
                /* ignore */
              }
            }
            return country || ''
          })
          .catch(function () {
            return ''
          })
      })
  }

  function init() {
    var el = document.getElementById('visitor-info')
    if (!el) return

    var labelVisiting = el.getAttribute('data-visiting') || 'Visiting from'
    var labelDevice = el.getAttribute('data-device') || 'Device'
    var labelUnknown = el.getAttribute('data-unknown') || 'Unknown'

    var device = detectDevice()

    detectCountry().then(function (country) {
      var countryText = country || labelUnknown
      // Use textContent to prevent XSS
      el.textContent = labelVisiting + ': ' + countryText + ' \u00B7 ' + labelDevice + ': ' + device
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
