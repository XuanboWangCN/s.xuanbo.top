// 定义缓存的名称（包含版本号以便更新）
const CACHE_NAME = 'JianSouSuo v10 fixed 2 re';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/ico.png',
  '/script.js',
  '/style.css',
  '/theme.js',
  '/title.js',
  '/UIsettings.js',
  '/function/settings/',
  '/function/settings/index.html',
  '/function/oobe/',
  '/function/oobe/index.html',
  '/function/oobe/oobe.js',
  '/simple-notice/index.js',
  '/bootstrap-5.3.8-dist/css/bootstrap.min.css',
  '/bootstrap-5.3.8-dist/js/bootstrap.bundle.min.js',
  '/privacypolicy/',
  '/privacypolicy/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('简·搜索: Log 正在缓存静态资源');
      return Promise.all(
        STATIC_ASSETS.map(asset => cache.add(asset).catch(err => {
          console.warn(`简·搜索: Warning 无法缓存资源: ${asset}`, err);
        }))
      );
    }).catch(err => {
      console.error('简·搜索: Error 缓存打开失败:', err);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cache => {
        if (cache !== CACHE_NAME) {
          console.log('简·搜索: Log 删除旧缓存:', cache);
          return caches.delete(cache);
        }
        return Promise.resolve();
      })
    ))
  );
});

function normalizeDocumentUrl(requestUrl) {
  const normalizedUrl = new URL(requestUrl.href);

  if (normalizedUrl.pathname === '/') {
    return normalizedUrl;
  }

  if (normalizedUrl.pathname.endsWith('/index.html')) {
    normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/index\.html$/i, '/');
  } else if (!/\.[^/]+$/.test(normalizedUrl.pathname) && !normalizedUrl.pathname.endsWith('/')) {
    normalizedUrl.pathname = `${normalizedUrl.pathname}/`;
  }

  return normalizedUrl;
}

function buildNormalizedRequest(request, requestUrl) {
  return new Request(requestUrl.href, {
    method: request.method,
    headers: request.headers,
    body: request.method === 'POST' ? request.body : undefined,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: 'follow',
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity
  });
}

function getCacheCandidates(requestUrl) {
  const candidates = [];
  const url = new URL(requestUrl.href);
  const normalizedPath = url.pathname.replace(/\/+$/g, '');

  if (url.pathname === '/') {
    candidates.push('/index.html');
  } else {
    candidates.push(url.pathname);
    if (url.pathname.endsWith('/')) {
      candidates.push(`${url.pathname}index.html`);
    } else {
      candidates.push(`${url.pathname}/index.html`);
      candidates.push(`${normalizedPath}/`);
    }
  }

  return candidates.filter((candidate, index, self) => self.indexOf(candidate) === index);
}

function cacheFirstWithFallback(request, requestUrl) {
  const cacheKeys = getCacheCandidates(requestUrl);

  return caches.match(requestUrl, { ignoreSearch: true })
    .then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return Promise.all(cacheKeys.map(cacheKey => caches.match(cacheKey, { ignoreSearch: true })))
        .then(matches => {
          const matched = matches.find(Boolean);
          if (matched) {
            return matched;
          }

          return fetch(request, { redirect: 'follow' })
            .then(response => {
              if (!response || response.status !== 200 || response.type === 'opaque') {
                return response;
              }

              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(requestUrl, responseClone).catch(err => {
                  console.warn(`简·搜索: Warning 无法缓存响应: ${requestUrl.href}`, err);
                });
                cacheKeys.forEach(cacheKey => {
                  cache.put(cacheKey, responseClone.clone()).catch(err => {
                    console.warn(`简·搜索: Warning 无法缓存响应: ${cacheKey}`, err);
                  });
                });
              });
              return response;
            })
            .catch(err => {
              console.error(`简·搜索: Error 请求失败: ${request.url}`, err);
              return caches.match('/index.html', { ignoreSearch: true }).then(cachedIndex => cachedIndex || new Response('页面暂不可用', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
              }));
            });
        });
    });
}

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isDocumentRequest = event.request.mode === 'navigate' || event.request.destination === 'document' || event.request.destination === 'iframe' || event.request.destination === 'embed';

  if (!isSameOrigin) {
    event.respondWith(
      fetch(event.request, { redirect: 'follow' }).catch(err => {
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
    const normalizedRequest = buildNormalizedRequest(event.request, normalizedUrl);
    event.respondWith(cacheFirstWithFallback(normalizedRequest, normalizedUrl));
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request, { redirect: 'follow' }).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone).catch(err => {
              console.warn(`简·搜索: Warning 无法缓存响应: ${event.request.url}`, err);
            });
          });
        }
        return response;
      });
    })
  );
});
