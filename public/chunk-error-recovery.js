// Enhanced iPad chunk loading error recovery with white screen prevention
(function() {
  // Detect if we're on iPad/iOS
  const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  console.log('[Recovery] Device detected:', isIPad ? 'iPad/iOS' : 'Other', navigator.userAgent);
  
  if (isIPad) {
    console.log('[Recovery] iPad detected - implementing enhanced error recovery');
    
    // Track reload attempts to prevent infinite loops
    const RELOAD_COUNT_KEY = '_ipad_reload_count';
    const MAX_RELOADS = 3;
    const RELOAD_TIMEOUT = 10000; // 10 seconds
    
    let reloadCount = parseInt(sessionStorage.getItem(RELOAD_COUNT_KEY) || '0');
    
    // Reset reload count after timeout
    setTimeout(() => {
      sessionStorage.removeItem(RELOAD_COUNT_KEY);
    }, RELOAD_TIMEOUT);
    
    // If too many reloads, stop trying and show error message
    if (reloadCount >= MAX_RELOADS) {
      console.warn('[Recovery] Too many reloads, stopping recovery to prevent white screen');
      
      // Show basic error message if page is blank
      setTimeout(() => {
        if (!document.body.innerHTML.trim() || document.body.innerHTML.length < 100) {
          document.body.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
              <h2>李希宁AI</h2>
              <p>iPad loading issue detected. Please:</p>
              <ol style="text-align: left; max-width: 300px; margin: 0 auto;">
                <li>Clear browser cache and cookies</li>
                <li>Close all browser tabs</li>
                <li>Restart your browser</li>
                <li><a href="javascript:location.reload(true)">Try refreshing again</a></li>
              </ol>
            </div>
          `;
        }
      }, 3000);
      return;
    }
    
    // Clear caches on first load
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
          caches.delete(cacheName);
          console.log('[Recovery] Deleted cache:', cacheName);
        });
      });
    }
    
    // Override fetch for no-cache
    const originalFetch = window.fetch;
    window.fetch = function(input, init = {}) {
      return originalFetch(input, {
        ...init,
        cache: 'no-cache',
        headers: {
          ...init.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    };
    
    // Smart reload function with throttling
    const smartReload = function(reason) {
      reloadCount++;
      sessionStorage.setItem(RELOAD_COUNT_KEY, reloadCount.toString());
      
      console.log(`[Recovery] Smart reload triggered (${reloadCount}/${MAX_RELOADS}):`, reason);
      
      if (reloadCount < MAX_RELOADS) {
        const url = new URL(window.location);
        url.searchParams.set('_recovery', Date.now());
        setTimeout(() => {
          window.location.replace(url.toString());
        }, 1000); // Give page time to show error
      }
    };
    
    // Error monitoring with smart filtering
    window.addEventListener('error', function(event) {
      const errorMessage = event.message || '';
      
      // Only trigger reload for actual chunk errors, not all errors
      if (/loading chunk \d+ failed|ChunkLoadError|Failed to fetch dynamically imported module/i.test(errorMessage)) {
        console.log('[Recovery] Chunk error detected:', errorMessage);
        smartReload('chunk_error');
      }
    }, true);
    
    // Promise rejection handling
    window.addEventListener('unhandledrejection', function(event) {
      const errorMessage = String(event.reason);
      
      if (/loading chunk \d+ failed|ChunkLoadError|Failed to fetch dynamically imported module/i.test(errorMessage)) {
        console.log('[Recovery] Chunk promise rejection:', errorMessage);
        event.preventDefault();
        smartReload('chunk_rejection');
      }
    });
    
    // Monitor for script loading failures
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.tagName === 'SCRIPT' && node.src && node.src.includes('chunks')) {
            node.addEventListener('error', function() {
              console.log('[Recovery] Script chunk failed:', node.src);
              smartReload('script_load_error');
            });
          }
        });
      });
    });
    
    if (document.head) {
      observer.observe(document.head, { childList: true });
    }
    
    // Health check with better logic
    let healthCheckCount = 0;
    const healthCheck = setInterval(function() {
      healthCheckCount++;
      
      // Check if page has reasonable content
      const hasContent = document.body && document.body.innerHTML.length > 100;
      const hasReact = window.React || document.querySelector('[data-reactroot]') || document.querySelector('#__next');
      
      if (healthCheckCount > 15 && !hasContent && !hasReact) {
        console.log('[Recovery] Health check failed - no content detected');
        clearInterval(healthCheck);
        smartReload('health_check_failed');
        return;
      }
      
      // Stop health check after 30 seconds if everything looks good
      if (healthCheckCount > 30 || (hasContent && hasReact)) {
        clearInterval(healthCheck);
        console.log('[Recovery] Health check completed successfully');
      }
    }, 1000);
    
    console.log('[Recovery] Enhanced iPad recovery system activated');
    
  } else {
    // Simplified recovery for non-iPad devices
    console.log('[Recovery] Standard recovery for non-iPad device');
    
    window.addEventListener('error', function(event) {
      const errorMessage = event.message || '';
      if (/loading chunk \d+ failed|ChunkLoadError/i.test(errorMessage)) {
        console.log('[Recovery] Chunk error on non-iPad, reloading');
        setTimeout(() => window.location.reload(), 2000);
      }
    });
  }
})();