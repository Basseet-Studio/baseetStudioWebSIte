# Quick Start Guide - Scroll Behavior Testing

## 🚀 Fastest Way to Test

### Option 1: Automated Browser Console Tests (Recommended)

1. **Open the site**: http://localhost:56476/
2. **Open DevTools**: Press `F12` or `Cmd+Option+I` (Mac)
3. **Go to Console tab**
4. **Run the test suite** (it's already loaded on localhost):
   ```javascript
   runAllTests()
   ```

That's it! The automated tests will run through all scenarios and show you the results.

### Option 2: Manual Testing with Test Page

1. **Open the test page**: http://localhost:56476/test-scroll-behavior.html
2. **Click "Go to Main Site"**
3. **Follow the checklist** on the test page

### Option 3: Quick Manual Tests

Visit http://localhost:56476/ and try these:

**Desktop Scroll Test**:
- Scroll down slowly → Should transition to site at ~150px
- Scroll to top, then scroll up for 300ms → Should return to clouds
- Scroll to top, quick scroll up → Should NOT return to clouds

**Keyboard Test**:
- Press Arrow Down / Page Down / Space → Should transition to site
- At top, press Arrow Up → Should return to clouds

**Mobile Test** (on phone/tablet):
- Swipe up → Should transition to site
- At top, swipe down for 300ms → Should return to clouds

---

## 📁 Test Files Created

### 1. Automated Test Suite
**File**: `assets/js/volumetric-clouds/test-scroll-behavior.js`
- Comprehensive automated tests
- Tests all scroll, touch, and keyboard behaviors
- Runs in browser console
- Provides detailed pass/fail results

### 2. Test Instructions
**File**: `assets/js/volumetric-clouds/TEST_INSTRUCTIONS.md`
- Detailed step-by-step testing instructions
- Manual testing procedures
- Debugging tips
- Success criteria

### 3. Test Results Template
**File**: `assets/js/volumetric-clouds/TEST_RESULTS.md`
- Template for recording test results
- Tracks all test cases
- Browser compatibility matrix
- Performance metrics

### 4. Test Page
**File**: `static/test-scroll-behavior.html`
- Visual test interface
- Quick access to main site
- Testing checklist
- Console instructions

---

## 🧪 What Gets Tested

### Desktop Scroll (14.1)
✅ Scroll down accumulation (150px threshold)  
✅ Scroll up stagger delay (300ms)  
✅ Quick scroll up ignored (<300ms)  

### Mobile Touch (14.2)
✅ Swipe up transitions to site  
✅ Swipe down at top returns to clouds  
✅ Touch gestures work smoothly  

### Keyboard Navigation (14.3)
✅ Arrow Down, Page Down, Space work in CLOUD_MODE  
✅ Arrow Up works at top in SITE_MODE  
✅ No keyboard traps  

---

## 🎯 Expected Results

All tests should **PASS** ✅

The automated test suite will show:
```
╔════════════════════════════════════════════════════════╗
║     TEST SUMMARY                                       ║
╚════════════════════════════════════════════════════════╝

✅ 14.1.1 - Scroll down accumulation (150px threshold)
✅ 14.1.2 - Scroll up stagger delay (300ms)
✅ 14.1.3 - Quick scroll up ignored (< 300ms)
✅ 14.2.1 - Swipe up transitions to site
✅ 14.2.2 - Swipe down at top returns to clouds
✅ 14.3.1 - Arrow Down, Page Down, Space in CLOUD_MODE
✅ 14.3.2 - Arrow Up at top in SITE_MODE
✅ 14.3.3 - No keyboard traps

============================================================
Total: 8/8 tests passed
Success Rate: 100.0%
============================================================

🎉 ALL TESTS PASSED! 🎉
```

---

## 🐛 Debugging

### Check Current State
```javascript
console.log('State:', window.scrollManager.state)
console.log('Scroll Y:', window.scrollY)
console.log('Accumulator:', window.scrollManager.scrollAccumulator)
```

### Force State Changes
```javascript
// Go to clouds
window.scrollManager.transitionToCloud()

// Go to site
window.scrollManager.transitionToSite()
```

### Monitor Events
```javascript
// Watch scroll events
window.addEventListener('wheel', (e) => {
    console.log('Wheel:', e.deltaY, 'State:', window.scrollManager.state)
})

// Watch keyboard events
window.addEventListener('keydown', (e) => {
    console.log('Key:', e.key, 'State:', window.scrollManager.state)
})
```

---

## 📊 Performance Monitoring

The site exposes debug objects on localhost:

```javascript
// Check FPS and performance
window.cloudRenderer.isAnimating  // Should be true when clouds visible
window.scrollManager.state        // Current state (CLOUD_MODE, SITE_MODE, TRANSITIONING)

// Check configuration
window.scrollManager.config
// {
//   scrollThreshold: 150,
//   staggerDelay: 300,
//   transitionDuration: 600
// }
```

---

## ✅ Success Criteria

Task 14 is complete when:
- ✅ All automated tests pass
- ✅ Manual testing confirms smooth behavior
- ✅ No console errors
- ✅ Performance is acceptable (>45 FPS mobile, >60 FPS desktop)
- ✅ Works across browsers (Chrome, Firefox, Safari, Edge)
- ✅ Works on mobile devices (iOS, Android)

---

## 🔗 Quick Links

- **Main Site**: http://localhost:56476/
- **Test Page**: http://localhost:56476/test-scroll-behavior.html
- **Test Instructions**: `assets/js/volumetric-clouds/TEST_INSTRUCTIONS.md`
- **Test Results**: `assets/js/volumetric-clouds/TEST_RESULTS.md`

---

## 💡 Tips

1. **Use Chrome DevTools** for best debugging experience
2. **Test on real mobile devices** for accurate touch behavior
3. **Check console for errors** during testing
4. **Use the automated tests first** to catch obvious issues
5. **Follow up with manual testing** for UX validation

---

## 📝 Next Steps

After testing is complete:
1. Fill out `TEST_RESULTS.md` with your findings
2. Fix any issues discovered
3. Re-run tests to verify fixes
4. Mark task 14 as complete in the spec

---

**Happy Testing! 🧪**
