# WebGL Clouds - Quick Testing Guide

## 🚀 Quick Start

Open your site in a browser and open DevTools Console. Run these commands:

## ✅ Verification Commands

### 1. Check Canvas Size
```javascript
const canvas = document.getElementById('heroCloudCanvas');
console.log('Canvas:', canvas.offsetWidth + 'x' + canvas.offsetHeight);
// Expected: Should show your screen dimensions (e.g., "1920x1080")
// ❌ If "0x0" → Canvas sizing bug still exists
```

### 2. Check Dependencies Loaded
```javascript
console.log('THREE.js:', window.THREE ? '✅ Loaded' : '❌ Missing');
console.log('CloudRenderer:', window.CloudRenderer ? '✅ Loaded' : '❌ Missing');
console.log('Renderer Instance:', window.heroCloudRenderer ? '✅ Initialized' : '❌ Not initialized');
```

### 3. Check WebGL Support
```javascript
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
console.log('WebGL:', gl ? '✅ Supported' : '❌ Not supported');
```

### 4. Force Re-initialization (if needed)
```javascript
// If clouds don't appear, try manual initialization
initHeroClouds();
```

## 🎯 Scroll Behavior Tests

### Test 1: Scroll DOWN (Fast)
1. Start at top of page (clouds visible)
2. Scroll down **slowly**
3. **Expected:** Clouds should zoom and fade within ~200px of scrolling
4. Title should become clearer
5. Transition to hero content should be quick

### Test 2: Scroll UP (Slow with Staging)
1. Start at hero content (clouds gone)
2. Scroll up **slowly**
3. **Expected:** 
   - First 100px: Strong "resistance" feeling (staging zone)
   - Next 300px: Normal scroll to clouds
   - Total: ~400px to fully reset
4. Clouds should reappear and title should blur

### Test 3: No Scroll Jumps
1. Watch the scroll position indicator in browser
2. Scroll down to trigger transition
3. **Expected:** Scroll position should NOT suddenly jump to 0
4. Should smoothly transition without teleporting

### Test 4: Click to Start
1. Click on the loader
2. **Expected:** Page should scroll down gently (~300px)
3. Should NOT force instant transition

## ♿ Accessibility Test

### Enable Reduced Motion
**macOS:**
System Settings → Accessibility → Display → Reduce motion

**Windows:**
Settings → Ease of Access → Display → Show animations

**After enabling:**
1. Reload page
2. **Expected:**
   - Clouds should be dimmed (opacity 0.5)
   - Title pulse animation disabled
   - Scroll indicator bounce disabled
   - Faster scroll thresholds (100px down, 150px up)

## 📱 Mobile Testing

### iOS Safari
1. Open site on iPhone/iPad
2. **Expected:**
   - Clouds should render
   - Smooth scroll with finger
   - No wheel event issues

### Android Chrome
1. Open site on Android device
2. **Expected:**
   - Same smooth behavior as iOS
   - Natural scroll physics

## 🐛 Common Issues & Fixes

### Issue: Canvas is 0x0
**Fix:** Check CSS is applied
```javascript
const style = window.getComputedStyle(canvas);
console.log('Width:', style.width, 'Height:', style.height);
```

### Issue: THREE.js not loaded
**Fix:** Check network tab for CDN
```javascript
// Wait for it to load
setTimeout(() => {
    console.log('THREE.js now:', window.THREE ? 'Loaded' : 'Still missing');
}, 2000);
```

### Issue: Clouds don't appear but no errors
**Fix:** Check WebGL context
```javascript
const gl = canvas.getContext('webgl');
if (!gl) {
    console.error('WebGL not available - check GPU drivers');
}
```

### Issue: Scroll feels wrong
**Fix:** Check reduced motion setting
```javascript
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
console.log('Reduced motion:', reducedMotion);
```

## ✨ Expected Console Output

When everything works correctly, you should see:

```
Initializing CloudRenderer with canvas dimensions: 1920 x 1080
THREE.js: ✅ Loaded
CloudRenderer: ✅ Loaded
Renderer Instance: ✅ Initialized
CloudRenderer initialized successfully
```

## 🔥 Performance Check

### Check FPS
1. Open DevTools → Performance tab
2. Click Record
3. Scroll up and down for 5 seconds
4. Stop recording
5. **Expected:** Green bars at 60fps (or higher on 120Hz displays)

### Check GPU Usage
1. Chrome: DevTools → Performance → Enable "Show GPU"
2. **Expected:** GPU should be utilized for WebGL rendering

## 📊 Success Criteria

- [ ] Canvas size > 0x0
- [ ] THREE.js loaded
- [ ] CloudRenderer initialized
- [ ] Clouds visible on screen
- [ ] Scroll down completes in ~200px
- [ ] Scroll up completes in ~400px with staging resistance
- [ ] No scroll position jumps
- [ ] Smooth 60fps performance
- [ ] Reduced motion works correctly
- [ ] No console errors

## 🎉 All Tests Pass?

Your WebGL volumetric clouds are working perfectly! Ready for production.

---

**Last Updated:** November 19, 2025
