/**
 * Global JavaScript for the theme
 */

class ThemeEvents {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Global theme object
window.theme = window.theme || {};
window.theme.events = new ThemeEvents();

// Utility functions
window.theme.utils = {
  // Debounce function
  debounce: function(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Throttle function
  throttle: function(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Get element by selector
  getElement: function(selector, context = document) {
    return context.querySelector(selector);
  },

  // Get elements by selector
  getElements: function(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  // Add event listener with cleanup
  addEvent: function(element, event, handler, options = {}) {
    if (!element) return;
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
  },

  // Format money
  formatMoney: function(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    let value = '';
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const formatString = format || '${{amount}}';

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';

      if (isNaN(number) || number === null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      const parts = number.split('.');
      const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      const centsAmount = parts[1] ? (decimal + parts[1]) : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }

    return formatString.replace(placeholderRegex, value);
  },

  // Serialize form data
  serializeForm: function(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    return data;
  },

  // Fetch with error handling
  fetchWithErrorHandling: async function(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
};

// Cart functionality
window.theme.cart = {
  // Get cart data
  get: async function() {
    try {
      return await window.theme.utils.fetchWithErrorHandling('/cart.js');
    } catch (error) {
      console.error('Error getting cart:', error);
      return null;
    }
  },

  // Add item to cart
  add: async function(items) {
    try {
      const response = await window.theme.utils.fetchWithErrorHandling('/cart/add.js', {
        method: 'POST',
        body: JSON.stringify({ items: Array.isArray(items) ? items : [items] })
      });
      
      window.theme.events.emit('cart:added', response);
      return response;
    } catch (error) {
      console.error('Error adding to cart:', error);
      window.theme.events.emit('cart:error', error);
      throw error;
    }
  },

  // Update cart item
  update: async function(updates) {
    try {
      const response = await window.theme.utils.fetchWithErrorHandling('/cart/update.js', {
        method: 'POST',
        body: JSON.stringify({ updates })
      });
      
      window.theme.events.emit('cart:updated', response);
      return response;
    } catch (error) {
      console.error('Error updating cart:', error);
      window.theme.events.emit('cart:error', error);
      throw error;
    }
  },

  // Change cart item quantity
  change: async function(line, quantity) {
    try {
      const response = await window.theme.utils.fetchWithErrorHandling('/cart/change.js', {
        method: 'POST',
        body: JSON.stringify({ line, quantity })
      });
      
      window.theme.events.emit('cart:changed', response);
      return response;
    } catch (error) {
      console.error('Error changing cart:', error);
      window.theme.events.emit('cart:error', error);
      throw error;
    }
  },

  // Clear cart
  clear: async function() {
    try {
      const response = await window.theme.utils.fetchWithErrorHandling('/cart/clear.js', {
        method: 'POST'
      });
      
      window.theme.events.emit('cart:cleared', response);
      return response;
    } catch (error) {
      console.error('Error clearing cart:', error);
      window.theme.events.emit('cart:error', error);
      throw error;
    }
  }
};

// Product functionality
window.theme.product = {
  // Get product recommendations
  getRecommendations: async function(productId, limit = 4) {
    try {
      const response = await window.theme.utils.fetchWithErrorHandling(
        `/recommendations/products.json?product_id=${productId}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Error getting product recommendations:', error);
      return null;
    }
  }
};

// Animation utilities
window.theme.animations = {
  // Fade in element
  fadeIn: function(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  },

  // Fade out element
  fadeOut: function(element, duration = 300) {
    let start = null;
    const initialOpacity = parseFloat(getComputedStyle(element).opacity);
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(initialOpacity - (progress / duration), 0);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    }
    
    requestAnimationFrame(animate);
  },

  // Slide down element
  slideDown: function(element, duration = 300) {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const targetHeight = element.scrollHeight;
    let start = null;
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const height = Math.min((progress / duration) * targetHeight, targetHeight);
      
      element.style.height = height + 'px';
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.height = '';
        element.style.overflow = '';
      }
    }
    
    requestAnimationFrame(animate);
  },

  // Slide up element
  slideUp: function(element, duration = 300) {
    const initialHeight = element.offsetHeight;
    element.style.overflow = 'hidden';
    
    let start = null;
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const height = Math.max(initialHeight - (progress / duration) * initialHeight, 0);
      
      element.style.height = height + 'px';
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
      }
    }
    
    requestAnimationFrame(animate);
  }
};

// Initialize theme when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize mobile menu toggle
  const mobileMenuToggle = window.theme.utils.getElement('[data-mobile-menu-toggle]');
  const mobileMenu = window.theme.utils.getElement('[data-mobile-menu]');
  
  if (mobileMenuToggle && mobileMenu) {
    window.theme.utils.addEvent(mobileMenuToggle, 'click', function(e) {
      e.preventDefault();
      mobileMenu.classList.toggle('is-open');
      document.body.classList.toggle('mobile-menu-open');
    });
  }

  // Initialize search toggle
  const searchToggle = window.theme.utils.getElement('[data-search-toggle]');
  const searchForm = window.theme.utils.getElement('[data-search-form]');
  
  if (searchToggle && searchForm) {
    window.theme.utils.addEvent(searchToggle, 'click', function(e) {
      e.preventDefault();
      searchForm.classList.toggle('is-open');
      if (searchForm.classList.contains('is-open')) {
        const searchInput = searchForm.querySelector('input[type="search"]');
        if (searchInput) searchInput.focus();
      }
    });
  }

  // Initialize quantity selectors
  const quantitySelectors = window.theme.utils.getElements('[data-quantity-selector]');
  quantitySelectors.forEach(selector => {
    const decreaseBtn = selector.querySelector('[data-quantity-decrease]');
    const increaseBtn = selector.querySelector('[data-quantity-increase]');
    const input = selector.querySelector('[data-quantity-input]');
    
    if (decreaseBtn && increaseBtn && input) {
      window.theme.utils.addEvent(decreaseBtn, 'click', function(e) {
        e.preventDefault();
        const currentValue = parseInt(input.value) || 1;
        if (currentValue > 1) {
          input.value = currentValue - 1;
          input.dispatchEvent(new Event('change'));
        }
      });
      
      window.theme.utils.addEvent(increaseBtn, 'click', function(e) {
        e.preventDefault();
        const currentValue = parseInt(input.value) || 1;
        input.value = currentValue + 1;
        input.dispatchEvent(new Event('change'));
      });
    }
  });

  // Initialize lazy loading for images
  if ('IntersectionObserver' in window) {
    const lazyImages = window.theme.utils.getElements('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // Initialize scroll-based animations
  if (window.theme.settings && window.theme.settings.animations_reveal_on_scroll) {
    const animatedElements = window.theme.utils.getElements('[data-animate-on-scroll]');
    
    if ('IntersectionObserver' in window && animatedElements.length > 0) {
      const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            animationObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      animatedElements.forEach(element => {
        element.classList.add('animate-ready');
        animationObserver.observe(element);
      });
    }
  }

  // Emit theme ready event
  window.theme.events.emit('theme:ready');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    window.theme.events.emit('theme:hidden');
  } else {
    window.theme.events.emit('theme:visible');
  }
});

// Handle window resize
window.addEventListener('resize', window.theme.utils.debounce(function() {
  window.theme.events.emit('theme:resize');
}, 250));

// Handle window scroll
window.addEventListener('scroll', window.theme.utils.throttle(function() {
  window.theme.events.emit('theme:scroll', {
    scrollY: window.scrollY,
    scrollX: window.scrollX
  });
}, 16)); // ~60fps

