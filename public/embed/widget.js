/**
 * Phone Guys Appointment Widget
 * Modern JavaScript embed for appointment scheduling
 */
(function(window) {
  'use strict';

  // Configuration
  const WIDGET_VERSION = '1.0.0';
  const DEFAULT_CONFIG = {
    apiKey: null,
    containerId: 'phoneguys-appointment-widget',
    baseUrl: 'https://dashboard.phoneguys.com', // This will be replaced by the route handler
    theme: 'light',
    primaryColor: '#06b6d4',
    width: '100%',
    maxWidth: '650px',
    height: '850px',
    position: 'inline', // 'inline', 'modal', 'slide-in'
    autoOpen: false,
    onSuccess: null,
    onError: null,
    onClose: null,
    customStyles: null
  };

  class PhoneGuysWidget {
    constructor(config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.iframe = null;
      this.container = null;
      this.isLoaded = false;
      this.messageHandlers = new Map();
      
      this.init();
    }

    init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      // Find or create container
      this.container = document.getElementById(this.config.containerId);
      
      if (!this.container) {
        console.error(`PhoneGuys Widget: Container #${this.config.containerId} not found`);
        return;
      }

      // Add widget styles
      this.injectStyles();
      
      // Create widget structure
      this.createWidget();
      
      // Setup message listeners
      this.setupMessageListeners();
      
      // Auto-open if configured
      if (this.config.autoOpen && this.config.position !== 'inline') {
        this.open();
      }
    }

    injectStyles() {
      if (document.getElementById('phoneguys-widget-styles')) return;
      
      const styles = document.createElement('style');
      styles.id = 'phoneguys-widget-styles';
      styles.innerHTML = `
        .phoneguys-widget-container {
          position: relative;
          width: ${this.config.width};
          max-width: ${this.config.maxWidth};
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .phoneguys-widget-container.inline {
          display: block;
        }
        
        .phoneguys-widget-container.modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999999;
          background: rgba(0, 0, 0, 0.5);
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .phoneguys-widget-container.modal.open {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .phoneguys-widget-container.slide-in {
          position: fixed;
          right: -100%;
          top: 0;
          bottom: 0;
          width: 100%;
          max-width: 480px;
          z-index: 999999;
          background: white;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
          transition: right 0.3s ease-in-out;
        }
        
        .phoneguys-widget-container.slide-in.open {
          right: 0;
        }
        
        .phoneguys-widget-modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: ${this.config.maxWidth};
          max-height: 90vh;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }
        
        .phoneguys-widget-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: ${this.config.primaryColor};
          color: white;
          border-radius: 12px 12px 0 0;
        }
        
        .phoneguys-widget-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        
        .phoneguys-widget-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }
        
        .phoneguys-widget-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .phoneguys-widget-iframe {
          width: 100%;
          height: ${this.config.height};
          border: none;
          display: block;
        }
        
        .phoneguys-widget-container.modal .phoneguys-widget-iframe {
          height: calc(90vh - 80px);
          max-height: 800px;
          border-radius: 0 0 12px 12px;
        }
        
        .phoneguys-widget-loader {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .phoneguys-widget-spinner {
          border: 3px solid #f3f4f6;
          border-top: 3px solid ${this.config.primaryColor};
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .phoneguys-widget-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${this.config.primaryColor};
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          z-index: 999998;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .phoneguys-widget-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        
        .phoneguys-widget-fab svg {
          width: 28px;
          height: 28px;
        }
        
        ${this.config.customStyles || ''}
      `;
      
      document.head.appendChild(styles);
    }

    createWidget() {
      // Clear container
      this.container.innerHTML = '';
      
      // Create widget wrapper
      const wrapper = document.createElement('div');
      wrapper.className = `phoneguys-widget-container ${this.config.position}`;
      
      if (this.config.position === 'modal') {
        // Modal wrapper
        const modalContent = document.createElement('div');
        modalContent.className = 'phoneguys-widget-modal-content';
        
        // Header
        const header = document.createElement('div');
        header.className = 'phoneguys-widget-header';
        
        const title = document.createElement('h3');
        title.className = 'phoneguys-widget-title';
        title.textContent = 'Schedule Your Repair';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'phoneguys-widget-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.close();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        modalContent.appendChild(header);
        
        // Iframe container
        const iframeContainer = document.createElement('div');
        iframeContainer.style.position = 'relative';
        
        // Loader
        const loader = document.createElement('div');
        loader.className = 'phoneguys-widget-loader';
        loader.innerHTML = `
          <div class="phoneguys-widget-spinner"></div>
          <div>Loading appointment form...</div>
        `;
        iframeContainer.appendChild(loader);
        
        modalContent.appendChild(iframeContainer);
        wrapper.appendChild(modalContent);
        
        // Create iframe
        this.iframe = this.createIframe();
        iframeContainer.appendChild(this.iframe);
        
        // Click outside to close
        wrapper.addEventListener('click', (e) => {
          if (e.target === wrapper) {
            this.close();
          }
        });
      } else if (this.config.position === 'slide-in') {
        // Slide-in panel
        const header = document.createElement('div');
        header.className = 'phoneguys-widget-header';
        
        const title = document.createElement('h3');
        title.className = 'phoneguys-widget-title';
        title.textContent = 'Schedule Your Repair';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'phoneguys-widget-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.close();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        wrapper.appendChild(header);
        
        // Create iframe
        this.iframe = this.createIframe();
        wrapper.appendChild(this.iframe);
      } else {
        // Inline mode
        // Loader
        const loader = document.createElement('div');
        loader.className = 'phoneguys-widget-loader';
        loader.innerHTML = `
          <div class="phoneguys-widget-spinner"></div>
          <div>Loading appointment form...</div>
        `;
        wrapper.appendChild(loader);
        
        // Create iframe
        this.iframe = this.createIframe();
        wrapper.appendChild(this.iframe);
      }
      
      this.container.appendChild(wrapper);
      
      // Create floating action button if not inline
      if (this.config.position !== 'inline') {
        this.createFAB();
      }
    }

    createIframe() {
      const iframe = document.createElement('iframe');
      iframe.className = 'phoneguys-widget-iframe';
      iframe.src = `${this.config.baseUrl}/embed/appointment-form`;
      iframe.title = 'Phone Guys Appointment Form';
      iframe.style.opacity = '0';
      iframe.onload = () => this.onIframeLoad();
      
      return iframe;
    }

    createFAB() {
      const fab = document.createElement('button');
      fab.className = 'phoneguys-widget-fab';
      fab.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
        </svg>
      `;
      fab.onclick = () => this.open();
      document.body.appendChild(fab);
    }

    onIframeLoad() {
      this.isLoaded = true;
      
      // Hide loader
      const loader = this.container.querySelector('.phoneguys-widget-loader');
      if (loader) {
        loader.style.display = 'none';
      }
      
      // Show iframe
      this.iframe.style.opacity = '1';
      
      // Send configuration to iframe
      this.sendMessage('config', {
        apiKey: this.config.apiKey,
        theme: this.config.theme,
        primaryColor: this.config.primaryColor
      });
    }

    setupMessageListeners() {
      window.addEventListener('message', (event) => {
        // Verify origin
        if (!event.origin.startsWith(this.config.baseUrl)) return;
        
        const { type, data } = event.data;
        
        switch (type) {
          case 'appointment-confirmed':
            this.handleSuccess(data);
            break;
          case 'appointment-error':
            this.handleError(data);
            break;
          case 'resize':
            this.handleResize(data);
            break;
          case 'close':
            this.close();
            break;
          default:
            // Handle custom message handlers
            if (this.messageHandlers.has(type)) {
              this.messageHandlers.get(type)(data);
            }
        }
      });
    }

    sendMessage(type, data) {
      if (this.iframe && this.isLoaded) {
        this.iframe.contentWindow.postMessage({ type, data }, this.config.baseUrl);
      }
    }

    handleSuccess(data) {
      console.log('Appointment confirmed:', data);
      
      if (this.config.onSuccess) {
        this.config.onSuccess(data);
      }
      
      // Auto-close after success (with delay for user to see confirmation)
      if (this.config.position !== 'inline') {
        setTimeout(() => this.close(), 3000);
      }
    }

    handleError(error) {
      console.error('Appointment error:', error);
      
      if (this.config.onError) {
        this.config.onError(error);
      }
    }

    handleResize(data) {
      if (data.height && this.config.position === 'inline') {
        this.iframe.style.height = `${data.height}px`;
      }
    }

    open() {
      const container = this.container.querySelector('.phoneguys-widget-container');
      if (container) {
        container.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }

    close() {
      const container = this.container.querySelector('.phoneguys-widget-container');
      if (container) {
        container.classList.remove('open');
        document.body.style.overflow = '';
      }
      
      if (this.config.onClose) {
        this.config.onClose();
      }
    }

    destroy() {
      // Remove styles
      const styles = document.getElementById('phoneguys-widget-styles');
      if (styles) styles.remove();
      
      // Remove FAB
      const fab = document.querySelector('.phoneguys-widget-fab');
      if (fab) fab.remove();
      
      // Clear container
      if (this.container) {
        this.container.innerHTML = '';
      }
      
      // Remove message listeners
      this.messageHandlers.clear();
    }

    // Public API methods
    on(event, handler) {
      this.messageHandlers.set(event, handler);
    }

    off(event) {
      this.messageHandlers.delete(event);
    }

    setApiKey(apiKey) {
      this.config.apiKey = apiKey;
      this.sendMessage('config', { apiKey });
    }

    submit(data) {
      this.sendMessage('submit', data);
    }
  }

  // Export to global scope
  window.PhoneGuysWidget = PhoneGuysWidget;
  
  // Also export as default for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoneGuysWidget;
  }
  
})(typeof window !== 'undefined' ? window : this);