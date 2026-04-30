// 定义缓存的名称（包含版本号以便更新）
const CACHE_NAME = 'JianSouSuoV8.23312.top';
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
  'https://cdn.bootcdn.net/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
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

// 拦截请求并返回缓存或网络
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 对于同源请求，使用缓存优先策略
  if (requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then(response => {
              // 缓存成功的响应
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone).catch(err => {
                    console.warn(`简·搜索: Warning 无法缓存响应: ${event.request.url}`, err);
                  });
                });
              }
              return response;
            })
            .catch(err => {
              console.error(`简·搜索: Error 请求失败: ${event.request.url}`, err);
              return new Response('网络请求失败，请检查您的网络连接', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
              });
            });
        })
        .catch(err => {
          console.error(`简·搜索: Error 缓存操作失败: ${event.request.url}`, err);
        })
    );
  } else {
    // 对于跨域请求，直接使用网络
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
  }
});
