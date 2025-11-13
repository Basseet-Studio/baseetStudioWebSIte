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

# Baseet Studio

Welcome to Baseet Studio, your premier digital innovation partner.
