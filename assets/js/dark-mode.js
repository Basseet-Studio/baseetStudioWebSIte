// Dark Mode Toggle with localStorage persistence

(function() {
  'use strict';
  
  // Check for saved theme preference or system preference
  function getPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Apply theme to document
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }
  
  // Toggle theme
  function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }
  
  // Apply saved theme immediately (before DOM is ready)
  applyTheme(getPreferredTheme());
  
  // Set up toggle button when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.dark-mode-toggle');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', toggleTheme);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  });
  
  // Expose toggle function globally
  window.toggleDarkMode = toggleTheme;
})();
