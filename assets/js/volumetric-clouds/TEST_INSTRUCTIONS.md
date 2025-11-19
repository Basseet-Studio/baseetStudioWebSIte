# Scroll Behavior Testing Instructions

This document provides instructions for testing the volumetric cloud scroll behavior across different devices and input methods.

## Prerequisites

1. Hugo development server must be running: `hugo server -D`
2. Open the site in a browser: `http://localhost:56476/` (or whatever port Hugo assigns)
3. The site must be running on localhost for debug access to `window.scrollManager` and `window.cloudRenderer`

## Automated Testing (Browser Console)

### Running the Automated Test Suite

1. Open the site in your browser
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the Console tab
4. Load the test script by copying and pasting the contents of `test-scroll-behavior.js`
5. Run the tests:
   ```javascript
   runAllTests()
   ```

The automated tests will:
- Test scroll down accumulation (150px threshold)
- Test scroll up stagger delay (300ms)
- Verify quick scroll up is ignored
- Test touch gestures (swipe up/down)
- Test keyboard navigation (Arrow keys, Page Down, Space)
- Verify no keyboard traps

### Expected Results

All tests should pass (✅). The test suite will print a summary showing:
- Individual test results
- Total pass/fail count
- Success rate percentage

## Manual Testing

### Test 14.1: Desktop Scroll Behavior

#### Test 14.1.1: Scroll Down Accumulation and Transition

**Requirements**: 3.1, 3.2, 3.3

**Steps**:
1. Refresh the page (should start in CLOUD_MODE with clouds visible)
2. Verify clouds are visible and animating
3. Scroll down slowly using mouse wheel
4. Observe the scroll indicator at the bottom of the screen filling up
5. Continue scrolling until you've scrolled approximately 150px
6. Verify the clouds fade out smoothly
7. Verify the site content fades in
8. Verify you are now in SITE_MODE (can scroll normally)

**Expected Behavior**:
- Scroll accumulates as you scroll down
- Progress indicator shows accumulation
- At 150px threshold, transition begins
- Clouds fade out over 600ms
- Site content becomes visible
- Body overflow changes to 'auto'
- Page scrolls to 1px position

**Pass Criteria**: ✅
- Transition occurs at ~150px of accumulated scroll
- Smooth fade transition (no jank)
- Site content is fully accessible after transition

#### Test 14.1.2: Scroll Up Stagger Delay

**Requirements**: 4.1, 4.2, 4.3

**Steps**:
1. Ensure you are in SITE_MODE (if not, scroll down to transition)
2. Scroll to the very top of the page (scrollY = 0)
3. Continue scrolling up (wheel up) and hold for at least 300ms
4. Observe the scroll indicator filling up
5. After 300ms, verify transition to CLOUD_MODE begins
6. Verify clouds fade in smoothly

**Expected Behavior**:
- Scroll up at top starts stagger delay timer
- Progress indicator shows time held (0-300ms)
- At 300ms, transition to clouds begins
- Clouds fade in over 600ms
- Body overflow changes to 'hidden'
- Page scrolls to top (0px)

**Pass Criteria**: ✅
- Transition occurs after 300ms of continuous scroll up
- Smooth fade transition
- Clouds are visible and animating

#### Test 14.1.3: Quick Scroll Up Ignored

**Requirements**: 4.1, 4.2, 4.3

**Steps**:
1. Ensure you are in SITE_MODE
2. Scroll to the very top of the page (scrollY = 0)
3. Quickly scroll up once or twice (less than 300ms total)
4. Stop scrolling
5. Verify you remain in SITE_MODE
6. Verify clouds do NOT appear

**Expected Behavior**:
- Quick scroll up does not trigger transition
- Stagger delay timer resets when scrolling stops
- User remains in SITE_MODE
- No visual changes occur

**Pass Criteria**: ✅
- No transition occurs for scroll up < 300ms
- User stays in SITE_MODE
- No accidental cloud return

### Test 14.2: Mobile Touch Behavior

**Requirements**: 5.2, 5.3, 5.4

**Note**: These tests should be performed on real mobile devices (iOS and Android) for accurate results.

#### Test 14.2.1: Swipe Up Transitions to Site

**Steps**:
1. Open the site on a mobile device
2. Verify clouds are visible (CLOUD_MODE)
3. Swipe up on the screen (touch and drag upward)
4. Continue swiping until ~150px of movement
5. Verify clouds fade out
6. Verify site content appears

**Expected Behavior**:
- Touch gestures work like wheel events
- Swipe up accumulates distance
- At 150px threshold, transition occurs
- Smooth transition on mobile

**Pass Criteria**: ✅
- Swipe up triggers transition at ~150px
- Smooth performance on mobile
- No touch event conflicts

#### Test 14.2.2: Swipe Down at Top Returns to Clouds

**Steps**:
1. Ensure you are in SITE_MODE on mobile
2. Scroll to the very top of the page
3. Swipe down and hold for at least 300ms
4. Verify transition to clouds begins
5. Verify clouds fade in smoothly

**Expected Behavior**:
- Swipe down at top starts stagger delay
- After 300ms, transition to clouds
- Smooth transition on mobile

**Pass Criteria**: ✅
- Swipe down at top triggers transition after 300ms
- Smooth performance
- No page bounce or scroll conflicts

#### Test 14.2.3: Test on Real Devices

**Devices to Test**:
- iPhone 12+ (iOS 15+)
- Samsung Galaxy S21+ (Android 11+)
- iPad Pro

**Metrics to Check**:
- FPS stays above 45
- No thermal throttling
- Touch gestures feel responsive
- Transitions are smooth

### Test 14.3: Keyboard Navigation

**Requirements**: 6.1, 6.2, 6.3, 6.4

#### Test 14.3.1: Arrow Down, Page Down, Space in CLOUD_MODE

**Steps**:
1. Refresh the page (start in CLOUD_MODE)
2. Press Arrow Down key
3. Verify transition to SITE_MODE
4. Refresh the page
5. Press Page Down key
6. Verify transition to SITE_MODE
7. Refresh the page
8. Press Space key
9. Verify transition to SITE_MODE

**Expected Behavior**:
- Each key triggers immediate transition
- No accumulation needed (unlike scroll)
- Smooth transition for all keys
- Default key behavior is prevented

**Pass Criteria**: ✅
- Arrow Down works
- Page Down works
- Space works
- All trigger smooth transitions

#### Test 14.3.2: Arrow Up at Top in SITE_MODE

**Steps**:
1. Ensure you are in SITE_MODE
2. Scroll to the very top (scrollY = 0)
3. Press Arrow Up key
4. Verify transition to CLOUD_MODE begins
5. Verify clouds fade in

**Expected Behavior**:
- Arrow Up at top triggers immediate transition
- No stagger delay for keyboard (unlike scroll)
- Smooth transition to clouds

**Pass Criteria**: ✅
- Arrow Up at top works
- Immediate transition (no delay)
- Clouds appear smoothly

#### Test 14.3.3: No Keyboard Traps

**Steps**:
1. Start in CLOUD_MODE
2. Use keyboard to navigate to SITE_MODE (Arrow Down)
3. Use Tab key to navigate through site content
4. Verify you can focus on all interactive elements
5. Scroll down using keyboard (Arrow Down, Page Down)
6. Scroll back to top using keyboard (Arrow Up, Page Up)
7. From top, press Arrow Up to return to clouds
8. Verify you can navigate back to site again

**Expected Behavior**:
- No keyboard traps in either mode
- All interactive elements are focusable
- Can freely navigate between modes
- Focus management is correct

**Pass Criteria**: ✅
- Can navigate freely with keyboard
- No elements trap focus
- Can transition between modes multiple times
- All content is accessible

## Testing Checklist

### Desktop (14.1)
- [ ] Scroll down accumulation works (150px threshold)
- [ ] Scroll up stagger delay works (300ms)
- [ ] Quick scroll up is ignored (< 300ms)
- [ ] Scroll indicator shows progress correctly
- [ ] Transitions are smooth (no jank)
- [ ] No console errors

### Mobile (14.2)
- [ ] Swipe up transitions to site (150px)
- [ ] Swipe down at top returns to clouds (300ms delay)
- [ ] Touch gestures feel responsive
- [ ] Performance is acceptable (>45 FPS)
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] No touch event conflicts

### Keyboard (14.3)
- [ ] Arrow Down works in CLOUD_MODE
- [ ] Page Down works in CLOUD_MODE
- [ ] Space works in CLOUD_MODE
- [ ] Arrow Up works at top in SITE_MODE
- [ ] No keyboard traps
- [ ] Focus management is correct
- [ ] Can navigate freely between modes

## Debugging

### Check Current State

In the browser console:
```javascript
// Check current state
console.log('State:', window.scrollManager.state)
console.log('Scroll Y:', window.scrollY)
console.log('Accumulator:', window.scrollManager.scrollAccumulator)
console.log('Scroll Up Timer:', window.scrollManager.scrollUpStartTime)

// Check body classes
console.log('Body classes:', document.body.className)

// Check cloud visibility
console.log('Cloud opacity:', document.getElementById('volumetric-cloud-canvas').style.opacity)
```

### Force State Changes

```javascript
// Force to CLOUD_MODE
window.scrollManager.transitionToCloud()

// Force to SITE_MODE
window.scrollManager.transitionToSite()
```

### Monitor Events

```javascript
// Log all wheel events
window.addEventListener('wheel', (e) => {
    console.log('Wheel:', e.deltaY, 'State:', window.scrollManager.state)
})

// Log all keyboard events
window.addEventListener('keydown', (e) => {
    console.log('Key:', e.key, 'State:', window.scrollManager.state)
})
```

## Known Issues

None currently identified.

## Success Criteria

All tests must pass for task 14 to be considered complete:
- ✅ Desktop scroll behavior works correctly
- ✅ Mobile touch behavior works correctly
- ✅ Keyboard navigation works correctly
- ✅ No keyboard traps
- ✅ Smooth transitions in all cases
- ✅ No console errors
- ✅ Performance is acceptable on all devices

## Notes

- The stagger delay (300ms) is intentional to prevent accidental returns to cloud mode
- The scroll threshold (150px) provides a good balance between ease of use and intentionality
- Keyboard navigation has no stagger delay for better accessibility
- Touch gestures use the same thresholds as wheel events for consistency
