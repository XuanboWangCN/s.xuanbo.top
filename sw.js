// 定义缓存的名称（包含版本号以便更新）
const CACHE_NAME = 'JianSouSuoV9';
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

  // 检查请求是否在缓存列表中
  const shouldCache = STATIC_ASSETS.some(asset => {
    if (asset.startsWith('http')) {
      return event.request.url === asset;
    }
    return requestUrl.origin === location.origin &&
           (requestUrl.pathname === asset ||
            (asset === '/' && requestUrl.pathname === '/index.html'));
  });

  if (shouldCache) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request);
        })
    );
  }
});
