// Chunk loading error recovery for iOS devices
(function() {
  // Track chunk loading errors
  let chunkLoadErrorCount = 0;
  const maxRetries = 3;
  
  // Original error handler
  const originalErrorHandler = window.onerror;
  
  // Enhanced error handler
  window.onerror = function(msg, url, line, col, error) {
    // Check if it's a chunk loading error
    if (msg && msg.toLowerCase().includes('loading chunk') && msg.toLowerCase().includes('failed')) {
      chunkLoadErrorCount++;
      console.warn(`Chunk loading error detected (${chunkLoadErrorCount}/${maxRetries}):`, msg);
      
      if (chunkLoadErrorCount <= maxRetries) {
        // Clear service worker cache and reload
        if ('serviceWorker' in navigator && 'caches' in window) {
          caches.keys().then(function(cacheNames) {
            return Promise.all(
              cacheNames.map(function(cacheName) {
                if (cacheName.includes('lixining-ai') || cacheName.includes('chatgpt-next-web')) {
                  console.log('Clearing cache:', cacheName);
                  return caches.delete(cacheName);
                }
              })
            );
          }).then(() => {
            // Notify service worker to skip waiting
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Reload page after a short delay
            setTimeout(() => {
              console.log('Reloading page due to chunk error...');
              window.location.reload(true);
            }, 1000);
          });
        } else {
          // Fallback: just reload
          setTimeout(() => {
            window.location.reload(true);
          }, 1000);
        }
        return true; // Prevent default error handling
      } else {
        // Too many retries, show user-friendly message
        if (confirm('页面加载出现问题，是否清除所有缓存数据并重新加载？')) {
          // Clear all storage
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              registrations.forEach(function(registration) {
                registration.unregister();
              });
            });
          }
          
          // Clear all caches
          if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
              return Promise.all(
                cacheNames.map(function(cacheName) {
                  return caches.delete(cacheName);
                })
              );
            });
          }
          
          // Clear local storage
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch (e) {
            console.warn('Could not clear storage:', e);
          }
          
          // Reload page
          window.location.href = window.location.origin;
        }
        return true;
      }
    }
    
    // Call original error handler for other errors
    if (originalErrorHandler) {
      return originalErrorHandler.apply(this, arguments);
    }
    return false;
  };
  
  // Also handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && 
        event.reason.message.toLowerCase().includes('loading chunk')) {
      console.warn('Unhandled chunk loading rejection:', event.reason);
      event.preventDefault();
      // Trigger the same recovery mechanism
      window.onerror(event.reason.message, '', 0, 0, event.reason);
    }
  });
  
  // Reset error count after successful page load
  window.addEventListener('load', function() {
    chunkLoadErrorCount = 0;
  });
})();