// Enhanced chunk loading error recovery for iPad/iOS devices
(function() {
  // Track chunk loading errors more aggressively
  let chunkLoadErrorCount = 0;
  const maxRetries = 2; // Reduced retries for faster recovery
  
  // Detect if we're on iPad/iOS
  const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  console.log('[Chunk Recovery] Device detected:', isIPad ? 'iPad/iOS' : 'Other', navigator.userAgent);
  
  // More aggressive error detection patterns
  const chunkErrorPatterns = [
    /loading chunk \d+ failed/i,
    /ChunkLoadError/i,
    /Loading chunk .* failed/i,
    /Failed to import/i,
    /Script error/i,
    /Network error/i
  ];
  
  // Immediate cache clearing function
  function clearAllCaches() {
    console.log('[Chunk Recovery] Clearing all caches...');
    
    // Clear service worker caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('[Chunk Recovery] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    }
    
    // Clear localStorage and sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('[Chunk Recovery] Could not clear storage:', e);
    }
    
    // Send message to service worker to clear caches
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL_CACHES' });
    }
  }
  
  // Force reload with cache busting
  function forceReload() {
    console.log('[Chunk Recovery] Force reloading page...');
    
    // Add cache busting parameter
    const url = new URL(window.location);
    url.searchParams.set('_cb', Date.now());
    
    // For iPad, use location.replace to avoid back button issues
    if (isIPad) {
      window.location.replace(url.toString());
    } else {
      window.location.href = url.toString();
    }
  }
  
  // Enhanced error handler
  function handleChunkError(errorMessage) {
    chunkLoadErrorCount++;
    console.warn(`[Chunk Recovery] Chunk error detected (${chunkLoadErrorCount}/${maxRetries}):`, errorMessage);
    
    if (chunkLoadErrorCount <= maxRetries) {
      // Immediate action for iPad
      if (isIPad) {
        clearAllCaches();
        setTimeout(forceReload, 500); // Shorter delay for iPad
      } else {
        clearAllCaches();
        setTimeout(forceReload, 1000);
      }
    } else {
      // Final recovery attempt
      console.error('[Chunk Recovery] Max retries exceeded, performing hard reset...');
      
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          registrations.forEach(function(registration) {
            registration.unregister();
          });
          setTimeout(() => {
            clearAllCaches();
            forceReload();
          }, 500);
        });
      } else {
        clearAllCaches();
        forceReload();
      }
    }
  }
  
  // Original error handler
  const originalErrorHandler = window.onerror;
  
  // Enhanced error handler for window.onerror
  window.onerror = function(msg, url, line, col, error) {
    const errorMessage = msg || (error && error.message) || '';
    
    // Check if it's a chunk loading error
    if (chunkErrorPatterns.some(pattern => pattern.test(errorMessage))) {
      handleChunkError(errorMessage);
      return true; // Prevent default error handling
    }
    
    // Call original error handler for other errors
    if (originalErrorHandler) {
      return originalErrorHandler.apply(this, arguments);
    }
    return false;
  };
  
  // Enhanced unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    const errorMessage = (event.reason && event.reason.message) || event.reason || '';
    
    if (chunkErrorPatterns.some(pattern => pattern.test(errorMessage))) {
      console.warn('[Chunk Recovery] Unhandled chunk loading rejection:', errorMessage);
      event.preventDefault();
      handleChunkError(errorMessage);
    }
  });
  
  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'SW_UPDATED' && event.data.action === 'FORCE_REFRESH') {
        console.log('[Chunk Recovery] Service worker updated, forcing refresh...');
        setTimeout(forceReload, 100);
      }
    });
  }
  
  // Reset error count after successful page load
  window.addEventListener('load', function() {
    chunkLoadErrorCount = 0;
    console.log('[Chunk Recovery] Page loaded successfully, reset error count');
  });
  
  // Additional DOM ready check for iPad
  if (isIPad) {
    document.addEventListener('DOMContentLoaded', function() {
      // Check if essential chunks loaded properly
      setTimeout(() => {
        if (!window.React || !window.ReactDOM) {
          console.warn('[Chunk Recovery] Essential chunks missing on iPad, triggering recovery...');
          handleChunkError('Essential chunks missing on iPad');
        }
      }, 2000);
    });
  }
  
  console.log('[Chunk Recovery] Enhanced chunk error recovery initialized for', isIPad ? 'iPad/iOS' : 'desktop');
})();