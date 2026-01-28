/**
 * AJAX Form Handler with Progressive Enhancement
 *
 * Submits the contact form via fetch POST to Formspree endpoint.
 * Falls back to standard form submission if JavaScript is disabled.
 * Provides accessible inline feedback with aria-live regions.
 */

;(function () {
  'use strict'

  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormHandler)
  } else {
    initFormHandler()
  }

  function initFormHandler() {
    const form = document.getElementById('contact-form')
    const contactForm = document.getElementById('contactForm')
    
    // Set page source for subscribe form based on current page
    if (form) {
      const pageSourceField = document.getElementById('subscribe-page-source')
      if (pageSourceField) {
        const currentPath = window.location.pathname
        let pageName = 'Home Page'
        if (currentPath.includes('/services')) pageName = 'Services Page'
        else if (currentPath.includes('/contact')) pageName = 'Contact Page'
        else if (currentPath.includes('/projects')) pageName = 'Projects Page'
        else if (currentPath.includes('/customers')) pageName = 'Customers Page'
        pageSourceField.value = pageName
      }
      form.addEventListener('submit', handleFormSubmit)
    }
    
    // Handle contact form
    if (contactForm) {
      contactForm.addEventListener('submit', handleContactFormSubmit)
    }
  }

  /**
   * Handle form submission with AJAX
   * @param {Event} event - Submit event
   */
  async function handleFormSubmit(event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)
    const submitButton = document.getElementById('submit-button')
    const buttonText = document.getElementById('button-text')
    const buttonSpinner = document.getElementById('button-spinner')
    const feedbackContainer = document.getElementById('form-feedback')
    const successMessage = document.getElementById('form-success')
    const errorMessage = document.getElementById('form-error')
    const errorText = document.getElementById('form-error-message')
    const emailInput = document.getElementById('subscribe-email')

    // Validate email before submission
    if (!emailInput.checkValidity()) {
      emailInput.focus()
      return
    }

    // Update UI to loading state
    setLoadingState(true, submitButton, buttonText, buttonSpinner)
    hideMessages(feedbackContainer, successMessage, errorMessage)

    try {
      // Submit form data to Formspree endpoint
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      })

      // Handle response
      if (response.ok) {
        showSuccess(feedbackContainer, successMessage, errorMessage, form)
      } else {
        // Parse error response
        const data = await response.json()
        const errorMsg =
          data.error || data.errors?.map((e) => e.message).join(', ') || 'Please check your email and try again.'
        showError(feedbackContainer, successMessage, errorMessage, errorText, errorMsg)
      }
    } catch (error) {
      // Network or fetch error
      try {
        const isDebug =
          typeof window !== 'undefined' &&
          (window.__DEBUG__ || ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(window.location.hostname))
        if (isDebug) console.error('Form submission error:', error)
      } catch (e) {
        /* ignore */
      }
      showError(
        feedbackContainer,
        successMessage,
        errorMessage,
        errorText,
        'Network error. Please check your connection and try again.'
      )
    } finally {
      // Reset loading state
      setLoadingState(false, submitButton, buttonText, buttonSpinner)
    }
  }

  /**
   * Set form loading state
   */
  function setLoadingState(isLoading, submitButton, buttonText, buttonSpinner) {
    if (isLoading) {
      submitButton.disabled = true
      submitButton.setAttribute('aria-busy', 'true')
      buttonText.textContent = 'Sending...'
      buttonSpinner.classList.remove('hidden')
    } else {
      submitButton.disabled = false
      submitButton.removeAttribute('aria-busy')
      buttonText.textContent = 'Get in Touch'
      buttonSpinner.classList.add('hidden')
    }
  }

  /**
   * Hide all feedback messages
   */
  function hideMessages(feedbackContainer, successMessage, errorMessage) {
    feedbackContainer.classList.add('hidden')
    successMessage.classList.add('hidden')
    errorMessage.classList.add('hidden')
  }

  /**
   * Show success message
   */
  function showSuccess(feedbackContainer, successMessage, errorMessage, form) {
    // Show success message
    feedbackContainer.classList.remove('hidden')
    successMessage.classList.remove('hidden')
    errorMessage.classList.add('hidden')

    // Reset form
    form.reset()

    // Scroll to feedback (smooth scroll)
    feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // Auto-hide success message after 8 seconds
    setTimeout(() => {
      successMessage.classList.add('hidden')
      feedbackContainer.classList.add('hidden')
    }, 8000)
  }

  /**
   * Show error message
   */
  function showError(feedbackContainer, successMessage, errorMessage, errorText, message) {
    // Show error message
    feedbackContainer.classList.remove('hidden')
    successMessage.classList.add('hidden')
    errorMessage.classList.remove('hidden')

    // Update error text
    errorText.textContent = message

    // Scroll to feedback
    feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // Auto-hide error message after 10 seconds
    setTimeout(() => {
      errorMessage.classList.add('hidden')
      feedbackContainer.classList.add('hidden')
    }, 10000)
  }

  /**
   * Handle contact form submission (for full contact page)
   */
  async function handleContactFormSubmit(event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)
    const submitBtn = document.getElementById('submitBtn')
    const formSuccess = document.getElementById('formSuccess')
    const formError = document.getElementById('formError')
    const originalBtnText = submitBtn.innerHTML

    // Update UI to loading state
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>Sending...</span>'
    formSuccess.classList.add('hidden')
    formError.classList.add('hidden')

    try {
      // Submit to Web3Forms
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      })

      if (response.ok) {
        // Show success
        formSuccess.classList.remove('hidden')
        form.reset()
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          formSuccess.classList.add('hidden')
        }, 8000)
      } else {
        // Show error
        formError.classList.remove('hidden')
        formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        
        setTimeout(() => {
          formError.classList.add('hidden')
        }, 10000)
      }
    } catch (error) {
      // Network error
      formError.classList.remove('hidden')
      formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      
      setTimeout(() => {
        formError.classList.add('hidden')
      }, 10000)
    } finally {
      // Reset button
      submitBtn.disabled = false
      submitBtn.innerHTML = originalBtnText
    }
  }
})()
