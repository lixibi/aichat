// Enhanced service worker registration with iPad detection and prevention
(function() {
  // Detect if we're on iPad/iOS
  const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  console.log('[ServiceWorker] Device detected:', isIPad ? 'iPad/iOS' : 'Other');
  
  // For iPad, completely disable service worker to prevent chunk errors
  if (isIPad) {
    console.log('[ServiceWorker] iPad detected, disabling service worker to prevent chunk errors');
    
    // Unregister any existing service workers on iPad
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        registrations.forEach(function(registration) {
          console.log('[ServiceWorker] Unregistering existing service worker for iPad');
          registration.unregister();
        });
      });
    }
    
    // Clear all caches on iPad
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('[ServiceWorker] Deleting cache for iPad:', cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    }
    
    return; // Exit early for iPad
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