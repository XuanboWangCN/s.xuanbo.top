// 定义缓存的名称（包含版本号以便更新）
const CACHE_NAME = 'JianSouSuo v10 fixed'; // 可以根据需要更新版本号
// 需要缓存的资源列表
const STATIC_ASSETS = [
  '/',
  '/ico.png',
  '/index.html',
  '/script.js',
  '/style.css',
  '/theme.js',
  '/title.js',
  '/UIsettings.js',
  '/function/settings/index.html',
  '/function/oobe/index.html',
  '/function/oobe/oobe.js',
  '/simple-notice/index.js',
  '/bootstrap-5.3.8-dist/css/bootstrap.min.css',
  '/bootstrap-5.3.8-dist/js/bootstrap.bundle.min.js'
];

// 安装阶段：缓存所有静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('简·搜索: Log 正在缓存静态资源');
        // 逐个添加资源，避免单个失败导致整个缓存失败
        return Promise.all(
          STATIC_ASSETS.map(asset => {
            return cache.add(asset).catch(err => {
              console.warn(`简·搜索: Warning 无法缓存资源: ${asset}`, err);
            });
          })
        );
      })
      .catch(err => {
        console.error('简·搜索: Error 缓存打开失败:', err);
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('简·搜索: Log 删除旧缓存:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

function normalizeDocumentUrl(requestUrl) {
  const normalizedUrl = new URL(requestUrl.href);
  if (normalizedUrl.pathname.endsWith('/index.html')) {
    normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/index\.html$/i, '/');
  }
  return normalizedUrl;
}

function cacheFirstWithFallback(request, cacheKey) {
  return caches.match(cacheKey)
    .then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request, { redirect: 'follow' })
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(cacheKey, responseClone).catch(err => {
              const keyLabel = typeof cacheKey === 'string' ? cacheKey : cacheKey.url || String(cacheKey);
              console.warn(`简·搜索: Warning 无法缓存响应: ${keyLabel}`, err);
            });
          });
          return response;
        })
        .catch(err => {
          console.error(`简·搜索: Error 请求失败: ${request.url}`, err);
          return caches.match('/index.html').then(cachedIndex => cachedIndex || new Response('页面暂不可用', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          }));
        });
    });
}

// 拦截请求并返回缓存或网络
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isDocumentRequest = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (!isSameOrigin) {
    event.respondWith(
      fetch(event.request).catch(err => {
        console.error(`简·搜索: Error 跨域请求失败: ${event.request.url}`, err);
        return new Response('网络请求失败', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
    );
    return;
  }

  if (isDocumentRequest) {
    const normalizedUrl = normalizeDocumentUrl(requestUrl);
    const normalizedRequest = new Request(normalizedUrl.href, {
      method: 'GET',
      headers: event.request.headers,
      credentials: event.request.credentials,
      redirect: 'follow',
      referrer: event.request.referrer,
      referrerPolicy: event.request.referrerPolicy,
      integrity: event.request.integrity,
      cache: event.request.cache
    });

    event.respondWith(cacheFirstWithFallback(normalizedRequest, normalizedUrl.href));
    return;
  }

  // 对于静态资源，使用缓存优先策略
  event.respondWith(cacheFirstWithFallback(event.request, event.request));
});
