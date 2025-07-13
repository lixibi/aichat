const LIXINING_AI_CACHE = "lixining-ai-cache-v3";
const LIXINING_AI_FILE_CACHE = "lixining-ai-file-v3";
let a="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";let nanoid=(e=21)=>{let t="",r=crypto.getRandomValues(new Uint8Array(e));for(let n=0;n<e;n++)t+=a[63&r[n]];return t};

self.addEventListener("activate", function (event) {
  console.log("ServiceWorker activated.");
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== LIXINING_AI_CACHE && cacheName !== LIXINING_AI_FILE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force claim all clients to ensure updated SW takes control
      return self.clients.claim();
    })
  );
});

self.addEventListener("install", function (event) {
  console.log("ServiceWorker installing...");
  self.skipWaiting();  // enable new version immediately
  event.waitUntil(
    caches.open(LIXINING_AI_CACHE).then(function (cache) {
      return cache.addAll([]);
    }),
  );
});

// Add error handling for chunk loading errors
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
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
  // console.debug('file', file, fileUrl, request)
  const cache = await caches.open(LIXINING_AI_FILE_CACHE)
  await cache.put(new Request(fileUrl), new Response(file, {
    headers: {
      'content-type': file.type,
      'content-length': file.size,
      'cache-control': 'no-cache', // file already store in disk
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
  
  // Handle chunk loading errors by bypassing cache for JS files
  if (url.pathname.includes('/_next/static/chunks/') && e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).catch(() => {
        // If fetch fails, try to reload the page
        console.warn('Chunk loading failed, will reload page');
        return new Response('', { 
          status: 302, 
          headers: { 'Location': '/' } 
        });
      })
    );
    return;
  }
});
