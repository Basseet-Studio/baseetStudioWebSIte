/**
 * Automated App Bar Transition Tests
 * Tests for Task 7: App bar visibility and transitions
 */

class AppBarTester {
    constructor() {
        this.appBar = document.getElementById('app-bar');
        this.results = {
            cloudMode: [],
            siteMode: [],
            transitions: []
        };
    }

    // Helper: Get computed styles
    getStyles(element) {
        return window.getComputedStyle(element);
    }

    // Helper: Parse opacity
    parseOpacity(value) {
        return parseFloat(value);
    }

    // Helper: Check if color is white (rgb(255, 255, 255))
    isWhiteColor(color) {
        const rgb = color.match(/\d+/g);
        if (rgb) {
            return rgb[0] === '255' && rgb[1] === '255' && rgb[2] === '255';
        }
        return false;
    }

    // Helper: Check if background is transparent
    isTransparent(bg) {
        return bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
    }

    // Helper: Check if shadow exists
    hasShadow(shadow) {
        return shadow !== 'none' && shadow !== '';
    }

    // Helper: Check if color matches brand primary (#496BC1 = rgb(73, 107, 193))
    isBrandPrimary(color) {
        const rgb = color.match(/\d+/g);
        if (rgb) {
            return rgb[0] === '73' && rgb[1] === '107' && rgb[2] === '193';
        }
        return false;
    }

    // Task 7.1: Test Cloud Mode Styling
    testCloudMode() {
        console.log('🧪 Testing Cloud Mode Styling (Task 7.1)...');
        
        // Set cloud mode
        this.appBar.classList.remove('app-bar-site');
        this.appBar.classList.add('app-bar-cloud');

        // Wait for styles to apply
        return new Promise(resolve => {
            setTimeout(() => {
                const styles = this.getStyles(this.appBar);
                const logoText = this.appBar.querySelector('.logo-text');
                const logoStyles = this.getStyles(logoText);
                const navLink = this.appBar.querySelector('.nav-links a');
                const navStyles = this.getStyles(navLink);

                const opacity = this.parseOpacity(styles.opacity);
                const bgColor = styles.backgroundColor;
                const shadow = styles.boxShadow;
                const logoColor = logoStyles.color;
                const navColor = navStyles.color;

                // Test 1: Verify 30% opacity (Requirement 1.1)
                const opacityTest = Math.abs(opacity - 0.3) < 0.01;
                this.results.cloudMode.push({
                    test: 'Opacity is 0.3 (30%)',
                    requirement: '1.1',
                    expected: '0.3',
                    actual: opacity.toFixed(2),
                    pass: opacityTest
                });

                // Test 2: Verify white text color (Requirement 1.2)
                const logoColorTest = this.isWhiteColor(logoColor);
                this.results.cloudMode.push({
                    test: 'Logo text is white',
                    requirement: '1.2',
                    expected: 'rgb(255, 255, 255)',
                    actual: logoColor,
                    pass: logoColorTest
                });

                const navColorTest = this.isWhiteColor(navColor);
                this.results.cloudMode.push({
                    test: 'Nav links are white',
                    requirement: '1.2',
                    expected: 'rgb(255, 255, 255)',
                    actual: navColor,
                    pass: navColorTest
                });

                // Test 3: Verify transparent background (Requirement 1.3)
                const bgTest = this.isTransparent(bgColor);
                this.results.cloudMode.push({
                    test: 'Background is transparent',
                    requirement: '1.3',
                    expected: 'transparent',
                    actual: bgColor,
                    pass: bgTest
                });

                // Test 4: Verify no shadow (Requirement 1.3)
                const shadowTest = !this.hasShadow(shadow);
                this.results.cloudMode.push({
                    test: 'No shadow',
                    requirement: '1.3',
                    expected: 'none',
                    actual: shadow,
                    pass: shadowTest
                });

                console.log('✅ Cloud Mode tests complete');
                resolve(this.results.cloudMode);
            }, 100);
        });
    }

    // Task 7.2: Test Site Mode Styling
    testSiteMode() {
        console.log('🧪 Testing Site Mode Styling (Task 7.2)...');
        
        // Set site mode
        this.appBar.classList.remove('app-bar-cloud');
        this.appBar.classList.add('app-bar-site');

        // Wait for styles to apply
        return new Promise(resolve => {
            setTimeout(() => {
                const styles = this.getStyles(this.appBar);
                const logoText = this.appBar.querySelector('.logo-text');
                const logoStyles = this.getStyles(logoText);
                const navLink = this.appBar.querySelector('.nav-links a');
                const navStyles = this.getStyles(navLink);

                const opacity = this.parseOpacity(styles.opacity);
                const bgColor = styles.backgroundColor;
                const shadow = styles.boxShadow;
                const logoColor = logoStyles.color;
                const navColor = navStyles.color;
                const backdropFilter = styles.backdropFilter || styles.webkitBackdropFilter;

                // Test 1: Verify 100% opacity (Requirement 1.4)
                const opacityTest = Math.abs(opacity - 1.0) < 0.01;
                this.results.siteMode.push({
                    test: 'Opacity is 1.0 (100%)',
                    requirement: '1.4',
                    expected: '1.0',
                    actual: opacity.toFixed(2),
                    pass: opacityTest
                });

                // Test 2: Verify brand colors (Requirement 1.5)
                const logoColorTest = this.isBrandPrimary(logoColor);
                this.results.siteMode.push({
                    test: 'Logo has brand color (#496BC1)',
                    requirement: '1.5',
                    expected: 'rgb(73, 107, 193)',
                    actual: logoColor,
                    pass: logoColorTest
                });

                // Test 3: Verify dark nav text (Requirement 1.5)
                const navColorTest = !this.isWhiteColor(navColor);
                this.results.siteMode.push({
                    test: 'Nav links have dark color',
                    requirement: '1.5',
                    expected: 'not white',
                    actual: navColor,
                    pass: navColorTest
                });

                // Test 4: Verify white background (Requirement 2.4)
                const bgTest = bgColor.includes('255');
                this.results.siteMode.push({
                    test: 'Background is white/semi-transparent',
                    requirement: '2.4',
                    expected: 'rgba(255, 255, 255, ...)',
                    actual: bgColor,
                    pass: bgTest
                });

                // Test 5: Verify backdrop blur (Requirement 2.4)
                const blurTest = backdropFilter && backdropFilter !== 'none';
                this.results.siteMode.push({
                    test: 'Has backdrop blur',
                    requirement: '2.4',
                    expected: 'blur(10px)',
                    actual: backdropFilter || 'none',
                    pass: blurTest
                });

                // Test 6: Verify shadow (Requirement 2.4)
                const shadowTest = this.hasShadow(shadow);
                this.results.siteMode.push({
                    test: 'Has shadow',
                    requirement: '2.4',
                    expected: 'box-shadow present',
                    actual: shadow.substring(0, 50) + '...',
                    pass: shadowTest
                });

                console.log('✅ Site Mode tests complete');
                resolve(this.results.siteMode);
            }, 100);
        });
    }

    // Task 7.3: Test Transition Smoothness
    testTransitions() {
        console.log('🧪 Testing Transition Smoothness (Task 7.3)...');
        
        const styles = this.getStyles(this.appBar);
        const transition = styles.transition;

        // Test 1: Verify 600ms duration (Requirements 2.1, 3.1)
        const has600ms = transition.includes('600ms');
        this.results.transitions.push({
            test: 'Has 600ms duration',
            requirement: '2.1, 3.1',
            expected: '600ms',
            actual: transition.match(/\d+ms/g)?.join(', ') || 'none',
            pass: has600ms
        });

        // Test 2: Verify cubic-bezier easing (Requirements 2.5, 3.2)
        const hasCubicBezier = transition.includes('cubic-bezier');
        this.results.transitions.push({
            test: 'Uses cubic-bezier easing',
            requirement: '2.5, 3.2',
            expected: 'cubic-bezier(0.4, 0, 0.2, 1)',
            actual: transition.match(/cubic-bezier\([^)]+\)/)?.[0] || 'none',
            pass: hasCubicBezier
        });

        // Test 3: Verify opacity transition (Requirements 2.1, 3.3)
        const hasOpacity = transition.includes('opacity');
        this.results.transitions.push({
            test: 'Transitions opacity',
            requirement: '2.1, 3.3',
            expected: 'opacity in transition',
            actual: hasOpacity ? 'yes' : 'no',
            pass: hasOpacity
        });

        // Test 4: Verify background transition (Requirements 2.2, 3.3)
        const hasBackground = transition.includes('background');
        this.results.transitions.push({
            test: 'Transitions background',
            requirement: '2.2, 3.3',
            expected: 'background-color in transition',
            actual: hasBackground ? 'yes' : 'no',
            pass: hasBackground
        });

        // Test 5: Verify box-shadow transition (Requirements 2.4, 3.3)
        const hasShadow = transition.includes('box-shadow');
        this.results.transitions.push({
            test: 'Transitions box-shadow',
            requirement: '2.4, 3.3',
            expected: 'box-shadow in transition',
            actual: hasShadow ? 'yes' : 'no',
            pass: hasShadow
        });

        console.log('✅ Transition tests complete');
        return Promise.resolve(this.results.transitions);
    }

    // Test FPS during transition (Requirement 10.1)
    testFPS() {
        console.log('🧪 Testing FPS during transitions (Requirement 10.1)...');
        
        return new Promise(resolve => {
            let frames = [];
            let lastTime = performance.now();
            let isMonitoring = true;

            const measureFrame = () => {
                if (!isMonitoring) return;

                const now = performance.now();
                const delta = now - lastTime;
                lastTime = now;
                frames.push(delta);

                requestAnimationFrame(measureFrame);
            };

            // Start monitoring
            measureFrame();

            // Trigger transition
            this.appBar.classList.remove('app-bar-cloud');
            this.appBar.classList.add('app-bar-site');

            setTimeout(() => {
                this.appBar.classList.remove('app-bar-site');
                this.appBar.classList.add('app-bar-cloud');
            }, 100);

            // Stop monitoring after transitions complete
            setTimeout(() => {
                isMonitoring = false;
                
                // Calculate average FPS
                const avgFrameTime = frames.reduce((a, b) => a + b, 0) / frames.length;
                const avgFPS = Math.round(1000 / avgFrameTime);

                const fpsTest = avgFPS >= 55; // Allow some margin (target is 60)
                this.results.transitions.push({
                    test: 'Maintains 60fps during transitions',
                    requirement: '10.1',
                    expected: '≥60 fps',
                    actual: `${avgFPS} fps`,
                    pass: fpsTest
                });

                console.log(`✅ FPS test complete: ${avgFPS} fps`);
                resolve(avgFPS);
            }, 1500);
        });
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting App Bar Test Suite...\n');
        
        await this.testCloudMode();
        await this.testSiteMode();
        await this.testTransitions();
        await this.testFPS();

        this.printResults();
        return this.results;
    }

    // Print results
    printResults() {
        console.log('\n📊 Test Results Summary\n');
        console.log('='.repeat(80));

        let totalTests = 0;
        let passedTests = 0;

        // Cloud Mode Results
        console.log('\n🌥️  Task 7.1: Cloud Mode Styling');
        console.log('-'.repeat(80));
        this.results.cloudMode.forEach(result => {
            totalTests++;
            if (result.pass) passedTests++;
            const icon = result.pass ? '✅' : '❌';
            console.log(`${icon} ${result.test}`);
            console.log(`   Requirement: ${result.requirement}`);
            console.log(`   Expected: ${result.expected}`);
            console.log(`   Actual: ${result.actual}`);
        });

        // Site Mode Results
        console.log('\n🏢 Task 7.2: Site Mode Styling');
        console.log('-'.repeat(80));
        this.results.siteMode.forEach(result => {
            totalTests++;
            if (result.pass) passedTests++;
            const icon = result.pass ? '✅' : '❌';
            console.log(`${icon} ${result.test}`);
            console.log(`   Requirement: ${result.requirement}`);
            console.log(`   Expected: ${result.expected}`);
            console.log(`   Actual: ${result.actual}`);
        });

        // Transition Results
        console.log('\n⚡ Task 7.3: Transition Smoothness');
        console.log('-'.repeat(80));
        this.results.transitions.forEach(result => {
            totalTests++;
            if (result.pass) passedTests++;
            const icon = result.pass ? '✅' : '❌';
            console.log(`${icon} ${result.test}`);
            console.log(`   Requirement: ${result.requirement}`);
            console.log(`   Expected: ${result.expected}`);
            console.log(`   Actual: ${result.actual}`);
        });

        // Summary
        console.log('\n' + '='.repeat(80));
        const percentage = Math.round((passedTests / totalTests) * 100);
        console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed (${percentage}%)\n`);

        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! App bar visibility and transitions are working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review the results above.');
        }
    }
}

// Export for use
export default AppBarTester;
