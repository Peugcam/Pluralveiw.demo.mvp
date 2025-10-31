// Service Worker para PluralView PWA
// Versão 1.0.0

const CACHE_NAME = 'pluralview-v1'
const RUNTIME_CACHE = 'pluralview-runtime-v1'

// Arquivos para cache offline (essenciais)
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
]

// Instalação: cachear arquivos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_CACHE_URLS)
    })
  )

  // Ativar imediatamente
  self.skipWaiting()
})

// Ativação: limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )

  // Controlar todas as páginas imediatamente
  return self.clients.claim()
})

// Fetch: estratégia Network First com Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Ignorar non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Ignorar requests de API (sempre buscar na network)
  if (request.url.includes('/api/')) {
    return
  }

  // Ignorar Chrome extensions e dev tools
  if (request.url.includes('chrome-extension://') || request.url.includes('devtools://')) {
    return
  }

  event.respondWith(
    networkFirstStrategy(request)
  )
})

// Estratégia: Network First, Cache Fallback
async function networkFirstStrategy(request) {
  try {
    // Tentar buscar da rede
    const networkResponse = await fetch(request)

    // Se sucesso, clonar e cachear para uso offline
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone()

      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, responseToCache)
      })
    }

    return networkResponse
  } catch (error) {
    // Se falhar (offline), tentar buscar do cache
    console.log('[SW] Network failed, fetching from cache:', request.url)

    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Se não houver cache, retornar página offline básica
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - PluralView</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .container {
            max-width: 500px;
            padding: 2rem;
          }
          h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.2rem;
            color: #cbd5e1;
            margin-bottom: 2rem;
          }
          button {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            border: none;
            padding: 1rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: transform 0.2s;
          }
          button:hover {
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📡</h1>
          <h2>Você está offline</h2>
          <p>
            Não foi possível conectar ao PluralView. Verifique sua conexão de internet
            e tente novamente.
          </p>
          <button onclick="window.location.reload()">Tentar Novamente</button>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'text/html'
        })
      }
    )
  }
}

// Background Sync (opcional - para análises offline futuras)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-analyses') {
    event.waitUntil(syncAnalyses())
  }
})

async function syncAnalyses() {
  // Implementar sincronização de análises offline no futuro
  console.log('[SW] Syncing offline analyses...')
}

// Notificações Push (preparado para futuro)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'pluralview-notification',
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification('PluralView', options)
  )
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)

  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})

console.log('[SW] Service Worker loaded successfully')
