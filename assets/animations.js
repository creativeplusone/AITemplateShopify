/**
 * Animation utilities and scroll-based animations
 */

class ScrollAnimations {
  constructor() {
    this.elements = [];
    this.observer = null;
    this.init();
  }

  init() {
    // Only initialize if animations are enabled
    if (!document.documentElement.classList.contains('animations-enabled')) {
      return;
    }

    this.setupObserver();
    this.findElements();
    this.observeElements();
  }

  setupObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.fallbackAnimation();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
  }

  findElements() {
    // Find elements with animation attributes
    const selectors = [
      '[data-animate]',
      '[data-animate-on-scroll]',
      '.animate-on-scroll',
      '.fade-in',
      '.slide-up',
      '.slide-down',
      '.slide-left',
      '.slide-right',
      '.zoom-in',
      '.zoom-out'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!this.elements.includes(element)) {
          this.elements.push(element);
          this.prepareElement(element);
        }
      });
    });
  }

  prepareElement(element) {
    // Add base animation class
    element.classList.add('animate-ready');
    
    // Set initial state based on animation type
    const animationType = this.getAnimationType(element);
    this.setInitialState(element, animationType);
  }

  getAnimationType(element) {
    // Check data attribute first
    if (element.dataset.animate) {
      return element.dataset.animate;
    }

    // Check class names
    const classList = element.classList;
    if (classList.contains('fade-in')) return 'fade-in';
    if (classList.contains('slide-up')) return 'slide-up';
    if (classList.contains('slide-down')) return 'slide-down';
    if (classList.contains('slide-left')) return 'slide-left';
    if (classList.contains('slide-right')) return 'slide-right';
    if (classList.contains('zoom-in')) return 'zoom-in';
    if (classList.contains('zoom-out')) return 'zoom-out';

    // Default animation
    return 'fade-in';
  }

  setInitialState(element, animationType) {
    switch (animationType) {
      case 'fade-in':
        element.style.opacity = '0';
        break;
      case 'slide-up':
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        break;
      case 'slide-down':
        element.style.opacity = '0';
        element.style.transform = 'translateY(-30px)';
        break;
      case 'slide-left':
        element.style.opacity = '0';
        element.style.transform = 'translateX(30px)';
        break;
      case 'slide-right':
        element.style.opacity = '0';
        element.style.transform = 'translateX(-30px)';
        break;
      case 'zoom-in':
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        break;
      case 'zoom-out':
        element.style.opacity = '0';
        element.style.transform = 'scale(1.2)';
        break;
    }

    // Add transition
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  }

  animateElement(element) {
    const delay = element.dataset.animateDelay || 0;
    
    setTimeout(() => {
      element.classList.add('animate-in');
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) translateX(0) scale(1)';
      
      // Emit custom event
      element.dispatchEvent(new CustomEvent('animated', {
        bubbles: true,
        detail: { element }
      }));
    }, parseInt(delay));
  }

  observeElements() {
    if (!this.observer) return;

    this.elements.forEach(element => {
      this.observer.observe(element);
    });
  }

  fallbackAnimation() {
    // Simple fallback for browsers without IntersectionObserver
    this.elements.forEach(element => {
      element.classList.add('animate-in');
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) translateX(0) scale(1)';
    });
  }

  // Public method to add new elements
  addElement(element) {
    if (!this.elements.includes(element)) {
      this.elements.push(element);
      this.prepareElement(element);
      if (this.observer) {
        this.observer.observe(element);
      }
    }
  }

  // Public method to refresh all elements
  refresh() {
    this.elements = [];
    this.findElements();
    this.observeElements();
  }
}

// Hover animations
class HoverAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.setupCardHovers();
    this.setupButtonHovers();
    this.setupImageHovers();
  }

  setupCardHovers() {
    const cards = document.querySelectorAll('.card, [data-hover="card"]');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '';
      });
    });
  }

  setupButtonHovers() {
    const buttons = document.querySelectorAll('.btn, [data-hover="button"]');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
      });
    });
  }

  setupImageHovers() {
    const images = document.querySelectorAll('[data-hover="zoom"]');
    
    images.forEach(container => {
      const img = container.querySelector('img');
      if (!img) return;

      container.style.overflow = 'hidden';
      img.style.transition = 'transform 0.3s ease';

      container.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.05)';
      });

      container.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
      });
    });
  }
}

// Parallax effects
class ParallaxEffects {
  constructor() {
    this.elements = [];
    this.init();
  }

  init() {
    this.findElements();
    this.bindEvents();
  }

  findElements() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    parallaxElements.forEach(element => {
      const speed = parseFloat(element.dataset.parallax) || 0.5;
      this.elements.push({
        element,
        speed,
        offset: element.getBoundingClientRect().top + window.pageYOffset
      });
    });
  }

  bindEvents() {
    if (this.elements.length === 0) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      
      this.elements.forEach(({ element, speed, offset }) => {
        const yPos = -(scrollTop - offset) * speed;
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    // Use throttled scroll for better performance
    window.addEventListener('scroll', this.throttle(handleScroll, 16));
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Loading animations
class LoadingAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.setupImageLoading();
    this.setupFormLoading();
  }

  setupImageLoading() {
    const images = document.querySelectorAll('img[data-loading="lazy"]');
    
    images.forEach(img => {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';
      
      img.addEventListener('load', () => {
        img.style.opacity = '1';
      });
    });
  }

  setupFormLoading() {
    const forms = document.querySelectorAll('form[data-loading]');
    
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
          submitBtn.classList.add('loading');
          submitBtn.disabled = true;
        }
      });
    });
  }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if animations should be enabled
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animationsEnabled = !prefersReducedMotion && 
    (document.documentElement.dataset.animationsEnabled !== 'false');

  if (animationsEnabled) {
    document.documentElement.classList.add('animations-enabled');
    
    // Initialize animation classes
    window.theme = window.theme || {};
    window.theme.scrollAnimations = new ScrollAnimations();
    window.theme.hoverAnimations = new HoverAnimations();
    window.theme.parallaxEffects = new ParallaxEffects();
    window.theme.loadingAnimations = new LoadingAnimations();
  }
});

// Handle dynamic content
document.addEventListener('shopify:section:load', () => {
  if (window.theme && window.theme.scrollAnimations) {
    window.theme.scrollAnimations.refresh();
  }
});

// CSS for animations (injected via JavaScript to ensure it's loaded)
const animationStyles = `
  .animate-ready {
    will-change: opacity, transform;
  }

  .animate-in {
    animation-fill-mode: both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideLeft {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideRight {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes zoomOut {
    from {
      opacity: 0;
      transform: scale(1.2);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Loading states */
  .loading {
    position: relative;
    pointer-events: none;
  }

  .loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .animate-ready,
    .animate-in {
      animation: none !important;
      transition: none !important;
    }
  }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

