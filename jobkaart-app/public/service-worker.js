// JobKaart Service Worker
// This enables offline functionality and makes the app feel native

const CACHE_NAME = 'jobkaart-v3'
const urlsToCache = [
  '/',
  '/dashboard',
  '/customers',
  '/quotes',
  '/manifest.json',
]

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch with network-first strategy for dynamic pages
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Dynamic pages that should ALWAYS fetch fresh data
  const dynamicPages = ['/dashboard', '/customers', '/quotes', '/jobs', '/invoices', '/api']
  const isDynamicPage = dynamicPages.some(page => url.pathname.startsWith(page))

  if (isDynamicPage) {
    // Network-first strategy: Try network, fallback to cache only if offline
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache GET requests (POST, PUT, DELETE cannot be cached)
          if (event.request.method === 'GET') {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone())
              return response
            })
          }
          return response
        })
        .catch(() => {
          // Network failed (offline) - serve from cache if available
          return caches.match(event.request)
        })
    )
  } else {
    // Cache-first strategy for static assets (images, CSS, JS)
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response
          }
          return fetch(event.request)
        })
    )
  }
})

// Update service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
