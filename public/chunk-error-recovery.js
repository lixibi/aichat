// ULTIMATE iPad chunk loading error recovery - zero tolerance approach
(function() {
  // Detect if we're on iPad/iOS
  const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  console.log('[ULTIMATE Recovery] Device detected:', isIPad ? 'iPad/iOS' : 'Other', navigator.userAgent);
  
  if (isIPad) {
    console.log('[ULTIMATE Recovery] iPad detected - implementing zero tolerance chunk error recovery');
    
    // Disable all caching for iPad immediately
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
          caches.delete(cacheName);
          console.log('[ULTIMATE Recovery] Deleted cache:', cacheName);
        });
      });
    }
    
    // Override fetch to always use no-cache for iPad
    const originalFetch = window.fetch;
    window.fetch = function(input, init = {}) {
      const headers = {
        ...init.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      return originalFetch(input, {
        ...init,
        cache: 'no-cache',
        headers
      });
    };
    
    // Immediate error recovery for any chunk errors
    const immediateReload = function() {
      console.log('[ULTIMATE Recovery] Immediate reload triggered for iPad');
      const url = new URL(window.location);
      url.searchParams.set('_ipad_refresh', Date.now());
      window.location.replace(url.toString());
    };
    
    // Intercept ALL possible error sources
    window.addEventListener('error', function(event) {
      const errorMessage = event.message || '';
      console.log('[ULTIMATE Recovery] Error detected:', errorMessage);
      
      // Any error related to loading or chunks triggers immediate reload
      if (/chunk|loading|import|script|network/i.test(errorMessage)) {
        console.log('[ULTIMATE Recovery] Chunk-related error detected, immediate reload');
        setTimeout(immediateReload, 100);
      }
    }, true);
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      const errorMessage = String(event.reason);
      console.log('[ULTIMATE Recovery] Promise rejection:', errorMessage);
      
      if (/chunk|loading|import|script|network/i.test(errorMessage)) {
        console.log('[ULTIMATE Recovery] Chunk-related rejection, immediate reload');
        setTimeout(immediateReload, 100);
      }
    });
    
    // Override all dynamic import functions to catch errors
    const originalImport = window.__webpack_require__;
    if (originalImport) {
      window.__webpack_require__ = function(...args) {
        try {
          return originalImport.apply(this, args);
        } catch (error) {
          console.log('[ULTIMATE Recovery] Webpack require error:', error);
          setTimeout(immediateReload, 100);
          throw error;
        }
      };
    }
    
    // Monitor for specific chunk loading failures
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.tagName === 'SCRIPT' && node.src && node.src.includes('chunks')) {
            node.addEventListener('error', function() {
              console.log('[ULTIMATE Recovery] Script chunk failed to load:', node.src);
              setTimeout(immediateReload, 50);
            });
          }
        });
      });
    });
    
    observer.observe(document.head, { childList: true });
    
    // Periodic health check for iPad
    let healthCheckCount = 0;
    const healthCheck = setInterval(function() {
      healthCheckCount++;
      
      // Check if essential libraries are available
      if (!window.React || !window.ReactDOM || document.querySelector('.error-boundary')) {
        console.log('[ULTIMATE Recovery] Health check failed, triggering reload');
        clearInterval(healthCheck);
        setTimeout(immediateReload, 100);
        return;
      }
      
      // Stop health check after 30 seconds if everything is fine
      if (healthCheckCount > 30) {
        clearInterval(healthCheck);
        console.log('[ULTIMATE Recovery] Health check completed successfully');
      }
    }, 1000);
    
    console.log('[ULTIMATE Recovery] Ultimate iPad recovery system activated');
    
  } else {
    // Original recovery system for non-iPad devices (simplified)
    console.log('[ULTIMATE Recovery] Standard recovery system for non-iPad device');
    
    window.addEventListener('error', function(event) {
      const errorMessage = event.message || '';
      if (/chunk.*failed|ChunkLoadError/i.test(errorMessage)) {
        console.log('[ULTIMATE Recovery] Chunk error on non-iPad, standard recovery');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }
})();