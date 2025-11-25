// Enhanced animations and interactions for Baseet Studio

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all enhancements
  initScrollAnimations();
  initParallaxEffect();
  initMagneticButtons();
  initCardTiltEffect();
  initImageHoverEffects();
  initStaggeredGridAnimations();
});

// Scroll animations with intersection observer
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Add stagger delay
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 100);
      }
    });
  }, observerOptions);

  // Observe all animation elements
  const animateSelectors = [
    '.scroll-animate',
    '.scroll-animate-left',
    '.scroll-animate-right',
    '.scroll-animate-scale'
  ];
  
  animateSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });
  });
}

// Parallax effect for decorative background elements
function initParallaxEffect() {
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        
        // Parallax for decorative background elements
        document.querySelectorAll('.absolute').forEach((el, i) => {
          if (el.className.includes('bg-primary') || el.className.includes('bg-tertiary')) {
            const speed = (i % 2 === 0) ? 0.3 : -0.3;
            el.style.transform = `translateY(${scrolled * speed}px)`;
            el.style.transition = 'transform 0.1s ease-out';
          }
        });
        
        ticking = false;
      });
      ticking = true;
    }
  });
}

// Magnetic effect for buttons - follows cursor
function initMagneticButtons() {
  document.querySelectorAll('a.bg-primary, button.bg-primary, .magnetic-button').forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = Math.max(rect.width, rect.height);
      
      if (distance < maxDistance) {
        button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.05)`;
      }
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
      button.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
    
    button.addEventListener('mouseenter', () => {
      button.style.transition = 'none';
    });
  });
}

// 3D tilt effect for cards on hover
function initCardTiltEffect() {
  document.querySelectorAll('.team-card, .feature-card, .hover-3d').forEach(card => {
    card.style.transition = 'all 0.1s ease';
    
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation based on cursor position
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;
      
      // Apply 3D transform
      card.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        scale3d(1.02, 1.02, 1.02)
      `;
      
      // Add subtle glow effect
      card.style.boxShadow = `
        0 20px 60px rgba(73, 107, 193, 0.3),
        0 0 40px rgba(251, 205, 55, 0.1)
      `;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
    
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'all 0.1s ease';
    });
  });
}

// Enhanced image hover effects
function initImageHoverEffects() {
  document.querySelectorAll('img:not(.no-hover)').forEach(img => {
    img.addEventListener('mouseenter', () => {
      img.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.6s ease';
    });
  });
}

// Staggered animations for grid items
function initStaggeredGridAnimations() {
  document.querySelectorAll('.grid > div, .grid > a, .grid > article').forEach((el, index) => {
    el.style.animationDelay = `${index * 0.15}s`;
    
    // Add scroll animation if not already present
    if (!el.classList.contains('scroll-animate')) {
      el.classList.add('scroll-animate-scale');
      
      // Create observer for this element
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      observer.observe(el);
    }
  });
}

// Add smooth reveal animation for sections
function initSectionReveal() {
  const sections = document.querySelectorAll('section');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1
  });
  
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    revealObserver.observe(section);
  });
}

// Initialize section reveal
setTimeout(initSectionReveal, 100);

// Enhanced smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      // Skip if it's just "#" or empty
      if (!href || href === '#' || href === '#ZgotmplZ') {
        e.preventDefault();
        return;
      }
      
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        // Smooth scroll to target
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without page jump
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      }
    });
  });
});
