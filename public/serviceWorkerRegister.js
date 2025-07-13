// Enhanced service worker registration with iPad-friendly approach
(function() {
  // Detect if we're on iPad/iOS
  const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  console.log('[ServiceWorker] Device detected:', isIPad ? 'iPad/iOS' : 'Other');
  
  // For iPad, be more conservative with service worker handling
  if (isIPad) {
    console.log('[ServiceWorker] iPad detected, using conservative approach');
    
    // Only unregister existing service workers if they exist, don't prevent normal loading
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        if (registrations.length > 0) {
          registrations.forEach(function(registration) {
            console.log('[ServiceWorker] Unregistering existing service worker for iPad');
            registration.unregister();
          });
        }
      }).catch(function(error) {
        console.log('[ServiceWorker] Error checking registrations:', error);
      });
    }
    
    // Clear problematic caches, but don't block page loading
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
          if (cacheName.includes('chunk') || cacheName.includes('static')) {
            caches.delete(cacheName);
            console.log('[ServiceWorker] Deleted problematic cache for iPad:', cacheName);
          }
        });
      }).catch(function(error) {
        console.log('[ServiceWorker] Error clearing caches:', error);
      });
    }
    
    // Don't register new service worker on iPad to avoid conflicts
    console.log('[ServiceWorker] Skipping service worker registration for iPad');
    return;
  }
  
  // Original service worker registration for non-iPad devices
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/serviceWorker.js').then(function (registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[ServiceWorker] New content is available; please refresh.');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
        
      }, function (err) {
        console.error('ServiceWorker registration failed: ', err);
      });
    });
  }
})();