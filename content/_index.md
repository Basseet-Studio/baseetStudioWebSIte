---
title: 'Baseet Studio'
description: 'Your trusted partner in digital innovation, creating exceptional web and mobile solutions.'
sections:
  - id: 'home'
    name: 'Home'
    template: 'hero'
  - id: 'about'
    name: 'About'
    template: 'highlights'
  - id: 'services'
    name: 'Services'
    template: 'features'
  - id: 'team'
    name: 'Team'
    template: 'team'
  - id: 'clients'
    name: 'Clients'
    template: 'clients'
  - id: 'contact'
    name: 'Contact'
    template: 'footer'
---

<style>
/* Gradient Heading Styles */
.gradient-heading {
  background: linear-gradient(135deg, #496BC1 0%, #FBCD37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  letter-spacing: -0.02em;
  display: inline-block;
  position: relative;
}

.gradient-heading::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #496BC1 0%, #FBCD37 100%);
  border-radius: 2px;
  transform: scaleX(0);
  transition: transform 0.6s ease;
}

.gradient-heading:hover::after {
  transform: scaleX(1);
}

/* Enhanced Features Section */
#features h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

#features .container > h1 {
  position: relative;
  padding-bottom: 1rem;
}

/* Smooth Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Apply animations to elements */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.animate-slide-in-left {
  animation: slideInLeft 0.8s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.8s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.6s ease-out;
}

/* Hover Effects */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* Button Animations */
a.bg-primary, button.bg-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

a.bg-primary::before, button.bg-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

a.bg-primary:hover::before, button.bg-primary:hover::before {
  width: 300px;
  height: 300px;
}

a.bg-primary:hover, button.bg-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(73, 107, 193, 0.4);
}

/* Scroll-triggered animations */
.scroll-animate {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.scroll-animate.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Image hover effects */
img {
  transition: transform 0.4s ease, filter 0.4s ease;
}

img:hover {
  transform: scale(1.03);
  filter: brightness(1.1);
}

/* Card hover effects */
.team-card, .feature-card {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .gradient-heading {
    font-size: 2rem;
  }

  #features h1 {
    font-size: 1.75rem;
  }
}
</style>

<script>
// Scroll animation observer
document.addEventListener('DOMContentLoaded', function() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe all scroll-animate elements
  document.querySelectorAll('.scroll-animate').forEach(el => {
    observer.observe(el);
  });


  // Add stagger effect to grid items
  document.querySelectorAll('.grid > div').forEach((el, index) => {
    el.style.animationDelay = `${index * 0.1}s`;
  });
});
</script>

<style>
/* ==========================================
   BASEET STUDIO LOADER WITH CLOUDS
   ========================================== */

.baseet-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.baseet-loader.scrolled {
  opacity: 0;
  transform: translateY(-100%);
  pointer-events: none;
}

/* Main Title */
.baseet-title {
  position: relative;
  z-index: 2;
  text-align: center;
  perspective: 1000px;
}

.baseet-title h1 {
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.1em;
  background: linear-gradient(135deg, #ffffff 0%, #496BC1 50%, #FBCD37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 80px rgba(73, 107, 193, 0.5);
  animation: titlePulse 3s ease-in-out infinite;
  filter: blur(0px);
  transition: filter 0.6s ease, transform 0.6s ease;
}

.baseet-loader.reveal .baseet-title h1 {
  filter: blur(0px);
  transform: scale(1.05);
}

@keyframes titlePulse {
  0%, 100% {
    text-shadow: 0 0 80px rgba(73, 107, 193, 0.5),
                 0 0 40px rgba(251, 205, 55, 0.3);
  }
  50% {
    text-shadow: 0 0 120px rgba(73, 107, 193, 0.8),
                 0 0 60px rgba(251, 205, 55, 0.5);
  }
}

/* Cloud Layers */
.cloud-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.cloud-back {
  z-index: 1;
}

.cloud-front {
  z-index: 3;
}

/* Individual Clouds - 3D-style with shadows and gradients */
.cloud {
  position: absolute;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%, 
    rgba(255, 255, 255, 0.6) 50%, 
    rgba(200, 220, 255, 0.4) 100%);
  border-radius: 100px;
  filter: blur(2px);
  box-shadow: 
    0 10px 50px rgba(255, 255, 255, 0.3),
    inset 0 -20px 40px rgba(150, 180, 255, 0.2);
  animation: cloudFloat 20s ease-in-out infinite;
  transition: transform 0.3s ease-out, opacity 0.5s ease-out;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 100px;
  filter: blur(1px);
}

/* Cloud 1 - Large back cloud */
.cloud-1 {
  width: 350px;
  height: 120px;
  top: 15%;
  left: 10%;
  animation-delay: 0s;
  animation-duration: 25s;
}

.cloud-1::before {
  width: 180px;
  height: 180px;
  top: -80px;
  left: 50px;
}

.cloud-1::after {
  width: 200px;
  height: 150px;
  top: -60px;
  right: 40px;
}

/* Cloud 2 - Medium back cloud */
.cloud-2 {
  width: 280px;
  height: 100px;
  top: 60%;
  right: 15%;
  animation-delay: -5s;
  animation-duration: 30s;
}

.cloud-2::before {
  width: 140px;
  height: 140px;
  top: -60px;
  left: 40px;
}

.cloud-2::after {
  width: 160px;
  height: 120px;
  top: -50px;
  right: 30px;
}

/* Cloud 3 - Small back cloud */
.cloud-3 {
  width: 220px;
  height: 80px;
  bottom: 20%;
  left: 25%;
  animation-delay: -10s;
  animation-duration: 22s;
}

.cloud-3::before {
  width: 110px;
  height: 110px;
  top: -50px;
  left: 30px;
}

.cloud-3::after {
  width: 120px;
  height: 90px;
  top: -40px;
  right: 25px;
}

/* Cloud 4 - Large front cloud (covers title) */
.cloud-4 {
  width: 400px;
  height: 140px;
  top: 30%;
  left: -5%;
  opacity: 0.95;
  animation-delay: -3s;
  animation-duration: 28s;
  filter: blur(3px);
}

.cloud-4::before {
  width: 200px;
  height: 200px;
  top: -90px;
  left: 60px;
}

.cloud-4::after {
  width: 220px;
  height: 170px;
  top: -70px;
  right: 50px;
}

/* Cloud 5 - Medium front cloud */
.cloud-5 {
  width: 320px;
  height: 110px;
  top: 50%;
  right: 10%;
  opacity: 0.9;
  animation-delay: -8s;
  animation-duration: 26s;
  filter: blur(2.5px);
}

.cloud-5::before {
  width: 160px;
  height: 160px;
  top: -70px;
  left: 50px;
}

.cloud-5::after {
  width: 180px;
  height: 140px;
  top: -60px;
  right: 40px;
}

/* Cloud 6 - Small front cloud */
.cloud-6 {
  width: 260px;
  height: 90px;
  bottom: 25%;
  right: 20%;
  opacity: 0.85;
  animation-delay: -12s;
  animation-duration: 24s;
  filter: blur(2px);
}

.cloud-6::before {
  width: 130px;
  height: 130px;
  top: -60px;
  left: 35px;
}

.cloud-6::after {
  width: 140px;
  height: 110px;
  top: -50px;
  right: 30px;
}

/* Cloud floating animation */
@keyframes cloudFloat {
  0%, 100% {
    transform: translateX(0) translateY(0) scale(1);
  }
  25% {
    transform: translateX(30px) translateY(-20px) scale(1.05);
  }
  50% {
    transform: translateX(0) translateY(-40px) scale(1);
  }
  75% {
    transform: translateX(-30px) translateY(-20px) scale(0.95);
  }
}

/* Scroll Indicator */
.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  animation: scrollBounce 2s ease-in-out infinite;
  opacity: 1;
  transition: opacity 0.5s ease;
}

.baseet-loader.scrolled .scroll-indicator {
  opacity: 0;
}

.scroll-indicator i {
  display: block;
  margin-top: 10px;
  font-size: 1.5rem;
  color: #FBCD37;
}

@keyframes scrollBounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-15px);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .cloud {
    transform: scale(0.7);
  }
  
  .cloud-1 { top: 10%; left: -10%; }
  .cloud-2 { top: 55%; right: -10%; }
  .cloud-3 { bottom: 15%; left: 15%; }
  .cloud-4 { top: 25%; left: -15%; }
  .cloud-5 { top: 45%; right: -5%; }
  .cloud-6 { bottom: 20%; right: 10%; }
}

/* Hide loader after scrolling */
body.loaded .baseet-loader {
  display: none;
}
</style>

<script>
// Baseet Studio Loader - Cloud Animation on Scroll
(function() {
  const loader = document.getElementById('baseet-loader');
  const title = document.querySelector('.baseet-title h1');
  const cloudBack = document.querySelector('.cloud-back');
  const cloudFront = document.querySelector('.cloud-front');
  
  let scrolled = false;
  
  // Prevent scrolling initially
  document.body.style.overflow = 'hidden';
  
  // Handle scroll to animate clouds away
  function handleScroll() {
    if (scrolled) return;
    
    const scrollY = window.scrollY || window.pageYOffset;
    
    if (scrollY > 50) {
      scrolled = true;
      loader.classList.add('scrolled');
      document.body.style.overflow = 'auto';
      
      // Remove loader completely after animation
      setTimeout(() => {
        document.body.classList.add('loaded');
      }, 800);
    }
  }
  
  // Parallax effect on scroll before fully scrolled
  function parallaxClouds() {
    if (scrolled) return;
    
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollPercent = Math.min(scrollY / 300, 1); // Normalize to 0-1
    
    // Move back clouds slower (away from screen)
    if (cloudBack) {
      cloudBack.style.transform = `translateY(${scrollPercent * -100}px) scale(${1 - scrollPercent * 0.3})`;
      cloudBack.style.opacity = 1 - scrollPercent * 0.8;
    }
    
    // Move front clouds faster (toward viewer then away)
    if (cloudFront) {
      cloudFront.style.transform = `translateY(${scrollPercent * 150}px) translateZ(${scrollPercent * 100}px) scale(${1 + scrollPercent * 0.5})`;
      cloudFront.style.opacity = 1 - scrollPercent * 0.9;
    }
    
    // Clear title blur as clouds move
    if (title) {
      title.style.filter = `blur(${Math.max(0, 8 - scrollPercent * 8)}px)`;
      title.style.transform = `scale(${1 + scrollPercent * 0.1})`;
    }
    
    // Add reveal class when partially scrolled
    if (scrollPercent > 0.3 && !loader.classList.contains('reveal')) {
      loader.classList.add('reveal');
    }
  }
  
  // Smooth scroll handling
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleScroll();
        parallaxClouds();
        ticking = false;
      });
      ticking = true;
    }
  });
  
  // Allow manual start with click or touch
  loader.addEventListener('click', function() {
    window.scrollTo({ top: 100, behavior: 'smooth' });
  });
  
  // Initial blur effect on title
  if (title) {
    title.style.filter = 'blur(8px)';
  }
})();
</script>

# Baseet Studio

Welcome to Baseet Studio, your premier digital innovation partner.
