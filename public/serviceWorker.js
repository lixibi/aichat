const LIXINING_AI_CACHE = "lixining-ai-cache-v4";
const LIXINING_AI_FILE_CACHE = "lixining-ai-file-v4";
let a="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";let nanoid=(e=21)=>{let t="",r=crypto.getRandomValues(new Uint8Array(e));for(let n=0;n<e;n++)t+=a[63&r[n]];return t};

self.addEventListener("activate", function (event) {
  console.log("ServiceWorker activated.");
  // Clean up ALL old caches aggressively
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete all caches except current version
          if (cacheName !== LIXINING_AI_CACHE && cacheName !== LIXINING_AI_FILE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force claim all clients immediately
      return self.clients.claim();
    }).then(() => {
      // Notify all clients to refresh if chunk errors detected
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', action: 'FORCE_REFRESH' });
        });
      });
    })
  );
});

self.addEventListener("install", function (event) {
  console.log("ServiceWorker installing...");
  self.skipWaiting();  // enable new version immediately
  event.waitUntil(
    caches.open(LIXINING_AI_CACHE).then(function (cache) {
      // Don't cache anything initially - let everything be fresh
      return cache.addAll([]);
    }),
  );
});

// Enhanced message handling
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    // Clear all caches on demand
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    });
  }
});

function jsonify(data) {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
}

async function upload(request, url) {
  const formData = await request.formData()
  const file = formData.getAll('file')[0]
  let ext = file.name.split('.').pop()
  if (ext === 'blob') {
    ext = file.type.split('/').pop()
  }
  const fileUrl = `${url.origin}/api/cache/${nanoid()}.${ext}`
  const cache = await caches.open(LIXINING_AI_FILE_CACHE)
  await cache.put(new Request(fileUrl), new Response(file, {
    headers: {
      'content-type': file.type,
      'content-length': file.size,
      'cache-control': 'no-cache',
      'server': 'ServiceWorker',
    }
  }))
  return jsonify({ code: 0, data: fileUrl })
}

async function remove(request, url) {
  const cache = await caches.open(LIXINING_AI_FILE_CACHE)
  const res = await cache.delete(request.url)
  return jsonify({ code: 0 })
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  
  // Handle API cache requests
  if (/^\/api\/cache\//.test(url.pathname)) {
    if ('GET' === e.request.method) {
      e.respondWith(caches.match(e.request))
    }
    if ('POST' === e.request.method) {
      e.respondWith(upload(e.request, url))
    }
    if ('DELETE' === e.request.method) {
      e.respondWith(remove(e.request, url))
    }
    return;
  }
  
  // AGGRESSIVE: Bypass cache for ALL Next.js static files on iPad/iOS
  const isNextStatic = url.pathname.includes('/_next/static/');
  const isChunk = url.pathname.includes('/chunks/');
  const isJS = url.pathname.endsWith('.js');
  
  if ((isNextStatic || isChunk || isJS) && e.request.method === 'GET') {
    console.log('Bypassing cache for:', url.pathname);
    e.respondWith(
      fetch(e.request, { 
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch((error) => {
        console.error('Fetch failed for:', url.pathname, error);
        // Try reloading the page as last resort
        return new Response(`
          <script>
            console.error('Chunk loading failed, reloading page...');
            window.location.reload(true);
          </script>
        `, { 
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }
});
