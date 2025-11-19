/**
 * Scroll Behavior Test Suite
 * Tests for desktop scroll, mobile touch, and keyboard navigation
 * 
 * Run this in the browser console after the page loads:
 * - Open http://localhost:56476/
 * - Open DevTools Console
 * - Copy and paste this entire file
 * - Run: runAllTests()
 */

class ScrollBehaviorTests {
    constructor() {
        this.results = [];
        this.scrollManager = window.scrollManager;
        this.cloudRenderer = window.cloudRenderer;
        
        if (!this.scrollManager) {
            console.error('ScrollManager not found. Make sure you are on localhost.');
            return;
        }
        
        console.log('ScrollBehaviorTests initialized');
        console.log('ScrollManager state:', this.scrollManager.state);
    }
    
    /**
     * Helper: Wait for a specified duration
     */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Helper: Simulate wheel event
     */
    simulateWheel(deltaY) {
        const event = new WheelEvent('wheel', {
            deltaY: deltaY,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Helper: Simulate touch events
     */
    simulateTouchStart(clientY) {
        const event = new TouchEvent('touchstart', {
            touches: [{ clientY: clientY }],
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }
    
    simulateTouchMove(clientY) {
        const event = new TouchEvent('touchmove', {
            touches: [{ clientY: clientY }],
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Helper: Simulate keyboard event
     */
    simulateKeyDown(key) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Helper: Reset to CLOUD_MODE
     */
    async resetToCloudMode() {
        if (this.scrollManager.state !== 'CLOUD_MODE') {
            // Force transition to cloud mode
            document.body.classList.remove('site-mode', 'transitioning');
            document.body.classList.add('cloud-mode');
            document.body.style.overflow = 'hidden';
            this.scrollManager.state = 'CLOUD_MODE';
            this.scrollManager.scrollAccumulator = 0;
            this.scrollManager.scrollUpStartTime = null;
            window.scrollTo(0, 0);
            
            if (this.cloudRenderer) {
                this.cloudRenderer.setVisibility(true);
            }
            
            await this.wait(100);
        }
    }
    
    /**
     * Helper: Reset to SITE_MODE
     */
    async resetToSiteMode() {
        if (this.scrollManager.state !== 'SITE_MODE') {
            // Force transition to site mode
            document.body.classList.remove('cloud-mode', 'transitioning');
            document.body.classList.add('site-mode');
            document.body.style.overflow = 'auto';
            this.scrollManager.state = 'SITE_MODE';
            this.scrollManager.scrollAccumulator = 0;
            this.scrollManager.scrollUpStartTime = null;
            window.scrollTo(0, 1);
            
            if (this.cloudRenderer) {
                this.cloudRenderer.setVisibility(false);
            }
            
            await this.wait(100);
        }
    }
    
    /**
     * Test 14.1.1: Verify scroll down accumulation and transition
     */
    async testScrollDownAccumulation() {
        console.log('\n=== Test 14.1.1: Scroll Down Accumulation ===');
        
        await this.resetToCloudMode();
        
        const initialState = this.scrollManager.state;
        console.log('Initial state:', initialState);
        
        // Simulate scrolling down in small increments
        for (let i = 0; i < 10; i++) {
            this.simulateWheel(20); // 20px per scroll
            await this.wait(50);
        }
        
        // Total: 200px scrolled (threshold is 150px)
        await this.wait(100);
        
        const finalState = this.scrollManager.state;
        console.log('Final state after 200px scroll:', finalState);
        
        // Wait for transition to complete
        await this.wait(700);
        
        const afterTransition = this.scrollManager.state;
        console.log('State after transition:', afterTransition);
        
        const passed = afterTransition === 'SITE_MODE';
        this.results.push({
            test: '14.1.1 - Scroll down accumulation (150px threshold)',
            passed: passed,
            details: `Initial: ${initialState}, Final: ${afterTransition}`
        });
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED');
        return passed;
    }
    
    /**
     * Test 14.1.2: Verify scroll up stagger delay works correctly
     */
    async testScrollUpStaggerDelay() {
        console.log('\n=== Test 14.1.2: Scroll Up Stagger Delay ===');
        
        await this.resetToSiteMode();
        
        // Ensure we're at the top
        window.scrollTo(0, 0);
        await this.wait(100);
        
        const initialState = this.scrollManager.state;
        console.log('Initial state:', initialState);
        console.log('Scroll position:', window.scrollY);
        
        // Simulate continuous upward scrolling for 400ms (exceeds 300ms threshold)
        const scrollDuration = 400;
        const scrollInterval = 50;
        const iterations = scrollDuration / scrollInterval;
        
        for (let i = 0; i < iterations; i++) {
            this.simulateWheel(-10); // Negative = scroll up
            await this.wait(scrollInterval);
        }
        
        // Wait a bit more for transition to start
        await this.wait(200);
        
        const duringTransition = this.scrollManager.state;
        console.log('State during/after stagger delay:', duringTransition);
        
        // Wait for full transition
        await this.wait(700);
        
        const finalState = this.scrollManager.state;
        console.log('Final state:', finalState);
        
        const passed = finalState === 'CLOUD_MODE';
        this.results.push({
            test: '14.1.2 - Scroll up stagger delay (300ms)',
            passed: passed,
            details: `Initial: ${initialState}, Final: ${finalState}`
        });
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED');
        return passed;
    }
    
    /**
     * Test 14.1.3: Test that quick scroll up is ignored
     */
    async testQuickScrollUpIgnored() {
        console.log('\n=== Test 14.1.3: Quick Scroll Up Ignored ===');
        
        await this.resetToSiteMode();
        
        // Ensure we're at the top
        window.scrollTo(0, 0);
        await this.wait(100);
        
        const initialState = this.scrollManager.state;
        console.log('Initial state:', initialState);
        
        // Simulate quick upward scroll (less than 300ms)
        for (let i = 0; i < 3; i++) {
            this.simulateWheel(-10);
            await this.wait(50);
        }
        
        // Total: 150ms of scrolling (below 300ms threshold)
        await this.wait(200);
        
        const finalState = this.scrollManager.state;
        console.log('Final state after quick scroll:', finalState);
        
        const passed = finalState === 'SITE_MODE';
        this.results.push({
            test: '14.1.3 - Quick scroll up ignored (< 300ms)',
            passed: passed,
            details: `Should stay in SITE_MODE. Final: ${finalState}`
        });
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED');
        return passed;
    }
    
    /**
     * Test 14.2.1: Verify swipe up transitions to site
     */
    async testSwipeUpTransition() {
        console.log('\n=== Test 14.2.1: Swipe Up Transition ===');
        
        await this.resetToCloudMode();
        
        const initialState = this.scrollManager.state;
        console.log('Initial state:', initialState);
        
        // Simulate swipe up gesture (touch start at bottom, move to top)
        this.simulateTouchStart(500);
        await this.wait(50);
        
        // Simulate upward swipe (200px movement)
        for (let i = 0; i < 10; i++) {
            this.simulateTouchMove(500 - (i + 1) * 20);
            await this.wait(20);
        }
        
        await this.wait(200);
        
        const duringTransition = this.scrollManager.state;
        console.log('State during transition:', duringTransition);
        
        // Wait for transition to complete
        await this.wait(700);
        
        const finalState = this.scrollManager.state;
        console.log('Final state:', finalState);
        
        const passed = finalState === 'SITE_MODE';
        this.results.push({
            test: '14.2.1 - Swipe up transitions to site',
            passed: passed,
            details: `Initial: ${initialState}, Final: ${finalState}`
        });
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED');
        return passed;
    }
    
    /**
     * Test 14.2.2: Verify swipe down at top returns to clouds after delay
     */
    async testSwipeDownAtTop() {
        console.log('\n=== Test 14.2.2: Swipe Down at Top ===');
        
        await this.resetToSiteMode();
        
        // Ensure we're at the top
        window.scrollTo(0, 0);
        await this.wait(100);
        
        const initialState = this.scrollManager.state;
        console.log('Initial state:', initialState);
        console.log('Scroll position:', window.scrollY);
        
        // Simulate downward swipe at top (hold for > 300ms)
        this.simulateTouchStart(300);
        await this.wait(50);
        
        // Simulate continuous downward swipe
        for (let i = 0; i < 8; i++) {
            this.simulateTouchMove(300 + (i + 1) * 10);
            await this.wait(50);
        }
        
        // Total: 400ms of swiping (exceeds 300ms threshold)
        await this.wait(200);
        
        const duringTransition = this.scrollManager.state;
        console.log('State during transition:', duringTransition);
        
        // Wait for transition to complete
        await this.wait(700);
        
        const finalState = this.scrollManager.state;
        console.log('Final state:', finalState);
        
        const passed = finalState === 'CLOUD_MODE';
        this.results.push({
            test: '14.2.2 - Swipe down at top returns to clouds',
            passed: passed,
            details: `Initial: ${initialState}, Final: ${finalState}`
        });
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED');
        return passed;
    }
    
    /**
     * Test 14.3.1: Verify Arrow Down, Page Down, Space work in CLOUD_MODE
     */
    async testKeyboardInCloudMode() {
        console.log('\n=== Test 14.3.1: Keyboard in CLOUD_MODE ===');
        
        const keys = ['ArrowDown', 'PageDown', ' '];
        const results = [];
        
        for (const key of keys) {
            await this.resetToCloudMode();
            
            const initialState = this.scrollManager.state;
            console.log(`Testing key: "${key}"`);
            
            this.simulateKeyDown(key);
            await this.wait(200);
            
            const duringTransition = this.scrollManager.state;
            console.log('State during transition:', duringTransition);
            
            // Wait for transition to complete
            await this.wait(700);
            
            const finalState = this.scrollManager.state;
            console.log('Final state:', finalState);
            
            const passed = finalState === 'SITE_MODE';
            results.push(passed);
            console.log(passed ? `✅ ${key} PASSED` : `❌ ${key} FAILED`);
        }
        
        const allPassed = results.every(r => r);
        this.results.push({
            test: '14.3.1 - Arrow Down, Page Down, Space in CLOUD_MODE',
            passed: allPassed,
            details: `ArrowDown: ${results[0]}, PageDown: ${results[1]}, Space: ${results[2]}`
        });
        
        return allPassed;
    }
    
    /**
     * Test 14.3.2: Verify Arrow Up works at top in SITE_MODE
     */
    async testArrowUpAtTop() {
        console.log('\n=== Test 14.3.2: Arrow Up at Top in SITE_MODE ===');
        
        await this.resetToSiteMode();
        
        // Ensure we're at the top
        window.scrollTo(0, 0);
        await this.wait(100);
        
        const initialState = this.scrollManager.state;
        console.log('Initial state:', initialState);
        console.log('Scroll position:', window.scrollY);
        
        this.simulateKeyDown('ArrowUp');
        await this.wait(200);
        
        const duringTransition = this.scrollManager.state;
        console.log('State during transition:', duringTransition);
        
        // Wait for transition to complete
        await this.wait(700);
        
        const finalState = this.scrollManager.state;
        console.log('Final state:', finalState);
        
        const passed = finalState === 'CLOUD_MODE';
        this.results.push({
            test: '14.3.2 - Arrow Up at top in SITE_MODE',
            passed: passed,
            details: `Initial: ${initialState}, Final: ${finalState}`
        });
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED');
        return passed;
    }
    
    /**
     * Test 14.3.3: Ensure no keyboard traps
     */
    async testNoKeyboardTraps() {
        console.log('\n=== Test 14.3.3: No Keyboard Traps ===');
        
        await this.resetToCloudMode();
        
        // Test that we can transition and use keyboard in both modes
        console.log('Testing keyboard navigation flow...');
        
        // From CLOUD_MODE to SITE_MODE
        this.simulateKeyDown('ArrowDown');
        await this.wait(800);
        
        const inSiteMode = this.scrollManager.state === 'SITE_MODE';
        console.log('Transitioned to SITE_MODE:', inSiteMode);
        
        // Scroll down a bit
        window.scrollTo(0, 100);
        await this.wait(100);
        
        // Try Arrow Up (should not transition since not at top)
        this.simulateKeyDown('ArrowUp');
        await this.wait(200);
        
        const stillInSiteMode = this.scrollManager.state === 'SITE_MODE';
        console.log('Still in SITE_MODE after Arrow Up (not at top):', stillInSiteMode);
        
        // Go back to top
        window.scrollTo(0, 0);
        await this.wait(100);
        
        // Now Arrow Up should work
        this.simulateKeyDown('ArrowUp');
        await this.wait(800);
        
        const backToCloudMode = this.scrollManager.state === 'CLOUD_MODE';
        console.log('Back to CLOUD_MODE:', backToCloudMode);
        
        const passed = inSiteMode && stillInSiteMode && backToCloudMode;
        this.results.push({
            test: '14.3.3 - No keyboard traps',
            passed: passed,
            details: `Can navigate freely between modes`
        });
        
        console.log(passed ? '✅ PASSED' : '❌ FAILED');
        return passed;
    }
    
    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║     SCROLL BEHAVIOR TEST SUITE                         ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        
        this.results = [];
        
        try {
            // Desktop scroll tests (14.1)
            await this.testScrollDownAccumulation();
            await this.testScrollUpStaggerDelay();
            await this.testQuickScrollUpIgnored();
            
            // Mobile touch tests (14.2)
            await this.testSwipeUpTransition();
            await this.testSwipeDownAtTop();
            
            // Keyboard navigation tests (14.3)
            await this.testKeyboardInCloudMode();
            await this.testArrowUpAtTop();
            await this.testNoKeyboardTraps();
            
            // Print summary
            this.printSummary();
            
        } catch (error) {
            console.error('Test suite error:', error);
        }
        
        // Reset to initial state
        await this.resetToCloudMode();
    }
    
    /**
     * Print test summary
     */
    printSummary() {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║     TEST SUMMARY                                       ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        this.results.forEach(result => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${result.test}`);
            if (result.details) {
                console.log(`   ${result.details}`);
            }
        });
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Total: ${passed}/${total} tests passed`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        console.log(`${'='.repeat(60)}\n`);
        
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! 🎉');
        } else {
            console.log('⚠️  Some tests failed. Review the details above.');
        }
    }
}

// Export for use in console
window.ScrollBehaviorTests = ScrollBehaviorTests;

// Helper function to run all tests
window.runAllTests = async function() {
    const tests = new ScrollBehaviorTests();
    if (tests.scrollManager) {
        await tests.runAllTests();
    } else {
        console.error('Cannot run tests: ScrollManager not available. Are you on localhost?');
    }
};

console.log('✅ Scroll Behavior Test Suite loaded!');
console.log('📝 Run tests with: runAllTests()');
