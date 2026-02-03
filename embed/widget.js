/**
 * PetCareHelperAI Embeddable Widget
 *
 * Usage: Add this script to your site and call PetCareWidget.init()
 *
 * Example:
 * <script src="https://petcarehelperai.netlify.app/embed/widget.js"></script>
 * <script>
 *   PetCareWidget.init({
 *     position: 'bottom-right', // 'bottom-right', 'bottom-left', or 'inline'
 *     containerId: 'pet-widget', // Only for inline mode
 *     theme: 'light' // 'light' or 'dark'
 *   });
 * </script>
 */

(function(window, document) {
  'use strict';

  var WIDGET_URL = 'https://petcarehelperai.netlify.app/embed/widget.html';
  var WIDGET_VERSION = '1.0.0';

  var defaultConfig = {
    position: 'bottom-right',
    containerId: null,
    theme: 'light',
    buttonText: 'Pet Help',
    width: '380px',
    height: '520px',
    zIndex: 9999
  };

  var isOpen = false;
  var widgetContainer = null;
  var toggleButton = null;
  var iframe = null;

  function createStyles() {
    var styleId = 'petcare-widget-styles';
    if (document.getElementById(styleId)) return;

    var css = [
      '.pcw-container { position: fixed; z-index: ' + defaultConfig.zIndex + '; font-family: system-ui, -apple-system, sans-serif; }',
      '.pcw-container.bottom-right { bottom: 20px; right: 20px; }',
      '.pcw-container.bottom-left { bottom: 20px; left: 20px; }',
      '.pcw-container.inline { position: relative; bottom: auto; right: auto; left: auto; }',

      '.pcw-toggle { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: linear-gradient(135deg, #14B8A6, #0D9488); color: white; border: none; border-radius: 50px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4); transition: all 0.3s ease; }',
      '.pcw-toggle:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(20, 184, 166, 0.5); }',
      '.pcw-toggle.active { border-radius: 50%; padding: 12px; }',
      '.pcw-toggle svg { width: 20px; height: 20px; fill: currentColor; }',
      '.pcw-toggle-text { }',
      '.pcw-toggle.active .pcw-toggle-text { display: none; }',

      '.pcw-frame-container { display: none; position: absolute; bottom: 70px; right: 0; width: ' + defaultConfig.width + '; height: ' + defaultConfig.height + '; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); background: white; animation: pcw-slide-up 0.3s ease; }',
      '.pcw-container.bottom-left .pcw-frame-container { right: auto; left: 0; }',
      '.pcw-container.inline .pcw-frame-container { position: relative; bottom: auto; right: auto; left: auto; display: block; width: 100%; height: 500px; animation: none; }',
      '.pcw-container.inline .pcw-toggle { display: none; }',
      '.pcw-frame-container.open { display: block; }',

      '.pcw-iframe { width: 100%; height: 100%; border: none; }',

      '@keyframes pcw-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }',

      '.pcw-close-btn { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(0,0,0,0.1); border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: background 0.2s; }',
      '.pcw-close-btn:hover { background: rgba(0,0,0,0.2); }',
      '.pcw-close-btn svg { width: 14px; height: 14px; fill: #334155; }',
      '.pcw-container.inline .pcw-close-btn { display: none; }'
    ].join('\n');

    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createWidget(config) {
    // Create container
    widgetContainer = document.createElement('div');
    widgetContainer.className = 'pcw-container ' + config.position;
    widgetContainer.id = 'petcare-widget';

    // Create toggle button
    toggleButton = document.createElement('button');
    toggleButton.className = 'pcw-toggle';
    toggleButton.setAttribute('aria-label', 'Open pet help chat');
    toggleButton.innerHTML = [
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>',
      '</svg>',
      '<span class="pcw-toggle-text">' + config.buttonText + '</span>'
    ].join('');

    // Create frame container
    var frameContainer = document.createElement('div');
    frameContainer.className = 'pcw-frame-container';
    if (config.position === 'inline') {
      frameContainer.classList.add('open');
    }

    // Create close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'pcw-close-btn';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.className = 'pcw-iframe';
    iframe.src = WIDGET_URL;
    iframe.setAttribute('title', 'PetCareHelperAI Chat Widget');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'clipboard-write');

    // Assemble
    frameContainer.appendChild(closeBtn);
    frameContainer.appendChild(iframe);
    widgetContainer.appendChild(frameContainer);
    widgetContainer.appendChild(toggleButton);

    // Event listeners
    toggleButton.addEventListener('click', function() {
      isOpen = !isOpen;
      frameContainer.classList.toggle('open', isOpen);
      toggleButton.classList.toggle('active', isOpen);
      toggleButton.setAttribute('aria-label', isOpen ? 'Close pet help chat' : 'Open pet help chat');

      // Change icon when open
      if (isOpen) {
        toggleButton.querySelector('svg').innerHTML = '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
      } else {
        toggleButton.querySelector('svg').innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>';
      }
    });

    closeBtn.addEventListener('click', function() {
      isOpen = false;
      frameContainer.classList.remove('open');
      toggleButton.classList.remove('active');
      toggleButton.setAttribute('aria-label', 'Open pet help chat');
      toggleButton.querySelector('svg').innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>';
    });

    // Append to DOM
    if (config.containerId && config.position === 'inline') {
      var targetContainer = document.getElementById(config.containerId);
      if (targetContainer) {
        targetContainer.appendChild(widgetContainer);
      } else {
        console.warn('PetCareWidget: Container with id "' + config.containerId + '" not found. Appending to body.');
        document.body.appendChild(widgetContainer);
      }
    } else {
      document.body.appendChild(widgetContainer);
    }
  }

  // Public API
  window.PetCareWidget = {
    version: WIDGET_VERSION,

    init: function(userConfig) {
      // Merge configs
      var config = {};
      for (var key in defaultConfig) {
        config[key] = userConfig && userConfig[key] !== undefined ? userConfig[key] : defaultConfig[key];
      }

      // Wait for DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          createStyles();
          createWidget(config);
        });
      } else {
        createStyles();
        createWidget(config);
      }
    },

    open: function() {
      if (toggleButton && !isOpen) {
        toggleButton.click();
      }
    },

    close: function() {
      if (toggleButton && isOpen) {
        toggleButton.click();
      }
    },

    toggle: function() {
      if (toggleButton) {
        toggleButton.click();
      }
    },

    destroy: function() {
      if (widgetContainer && widgetContainer.parentNode) {
        widgetContainer.parentNode.removeChild(widgetContainer);
      }
      widgetContainer = null;
      toggleButton = null;
      iframe = null;
      isOpen = false;
    }
  };

})(window, document);
