(function() {
  'use strict';

  // Configuration from script tag
  const script = document.currentScript;
  const config = {
    apiKey: script.dataset.apiKey || '',
    theme: script.dataset.theme || 'light',
    primaryColor: script.dataset.primaryColor || '#0066cc',
    fontFamily: script.dataset.fontFamily || 'system-ui, -apple-system, sans-serif',
    locale: script.dataset.locale || 'en-US',
    env: script.dataset.env || 'production',
    baseUrl: script.dataset.baseUrl || 'https://yourcrm.com'
  };

  // Widget styles
  const styles = `
    .phoneguys-widget-container {
      position: relative;
      width: 100%;
      min-height: 600px;
      font-family: ${config.fontFamily};
    }
    
    .phoneguys-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .phoneguys-widget-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    
    .phoneguys-widget-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid ${config.primaryColor};
      border-radius: 50%;
      animation: phoneguys-spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes phoneguys-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .phoneguys-widget-error {
      padding: 20px;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      color: #c00;
      text-align: center;
    }
    
    .phoneguys-widget-error h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .phoneguys-widget-error p {
      margin: 0;
      font-size: 14px;
    }
    
    @media (max-width: 640px) {
      .phoneguys-widget-container {
        min-height: 500px;
      }
    }
  `;

  // Inject styles
  function injectStyles() {
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }

  // Create widget container
  function createWidget() {
    const targetElement = document.getElementById('phoneguys-appointment-form');
    
    if (!targetElement) {
      console.error('Phone Guys Widget: Target element #phoneguys-appointment-form not found');
      return;
    }

    // Clear any existing content
    targetElement.innerHTML = '';
    targetElement.className = 'phoneguys-widget-container';

    // Create loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'phoneguys-widget-loading';
    loadingDiv.innerHTML = `
      <div class="phoneguys-widget-spinner"></div>
      <div style="color: #666; font-size: 14px;">Loading appointment form...</div>
    `;
    targetElement.appendChild(loadingDiv);

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'phoneguys-widget-iframe';
    iframe.style.display = 'none';
    
    // Build iframe URL with parameters
    const params = new URLSearchParams({
      apiKey: config.apiKey,
      theme: config.theme,
      primaryColor: config.primaryColor,
      locale: config.locale,
      embedded: 'true',
      origin: window.location.origin
    });
    
    iframe.src = `${config.baseUrl}/public-form?${params.toString()}`;
    
    // Handle iframe load
    iframe.onload = function() {
      loadingDiv.style.display = 'none';
      iframe.style.display = 'block';
      
      // Send configuration to iframe
      iframe.contentWindow.postMessage({
        type: 'PHONEGUYS_CONFIG',
        config: config
      }, config.baseUrl);
    };
    
    // Handle iframe error
    iframe.onerror = function() {
      loadingDiv.style.display = 'none';
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'phoneguys-widget-error';
      errorDiv.innerHTML = `
        <h3>Unable to load appointment form</h3>
        <p>Please check your internet connection or try again later.</p>
      `;
      targetElement.appendChild(errorDiv);
    };
    
    targetElement.appendChild(iframe);

    // Handle messages from iframe
    window.addEventListener('message', function(event) {
      // Verify origin
      if (event.origin !== config.baseUrl) return;
      
      const { type, data } = event.data;
      
      switch(type) {
        case 'PHONEGUYS_RESIZE':
          // Auto-resize iframe to content height
          if (data.height) {
            iframe.style.height = data.height + 'px';
          }
          break;
          
        case 'PHONEGUYS_SUCCESS':
          // Handle successful appointment creation
          if (window.phoneGuysOnSuccess) {
            window.phoneGuysOnSuccess(data);
          }
          
          // Dispatch custom event
          const successEvent = new CustomEvent('phoneguys:appointment:success', {
            detail: data
          });
          document.dispatchEvent(successEvent);
          break;
          
        case 'PHONEGUYS_ERROR':
          // Handle errors
          if (window.phoneGuysOnError) {
            window.phoneGuysOnError(data);
          }
          
          // Dispatch custom event
          const errorEvent = new CustomEvent('phoneguys:appointment:error', {
            detail: data
          });
          document.dispatchEvent(errorEvent);
          break;
          
        case 'PHONEGUYS_READY':
          // Widget is ready
          if (window.phoneGuysOnReady) {
            window.phoneGuysOnReady();
          }
          
          // Dispatch custom event
          const readyEvent = new CustomEvent('phoneguys:ready');
          document.dispatchEvent(readyEvent);
          break;
      }
    });
  }

  // Public API
  window.PhoneGuysWidget = {
    init: createWidget,
    config: config,
    
    // Methods for programmatic control
    reset: function() {
      const iframe = document.querySelector('.phoneguys-widget-iframe');
      if (iframe) {
        iframe.contentWindow.postMessage({
          type: 'PHONEGUYS_RESET'
        }, config.baseUrl);
      }
    },
    
    prefill: function(data) {
      const iframe = document.querySelector('.phoneguys-widget-iframe');
      if (iframe) {
        iframe.contentWindow.postMessage({
          type: 'PHONEGUYS_PREFILL',
          data: data
        }, config.baseUrl);
      }
    },
    
    setTheme: function(theme) {
      const iframe = document.querySelector('.phoneguys-widget-iframe');
      if (iframe) {
        iframe.contentWindow.postMessage({
          type: 'PHONEGUYS_SET_THEME',
          theme: theme
        }, config.baseUrl);
      }
    },
    
    destroy: function() {
      const targetElement = document.getElementById('phoneguys-appointment-form');
      if (targetElement) {
        targetElement.innerHTML = '';
        targetElement.className = '';
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectStyles();
      createWidget();
    });
  } else {
    injectStyles();
    createWidget();
  }
})();