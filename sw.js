// 定义缓存的名称（包含版本号以便更新）
const CACHE_NAME = 'JianSouSuoV8.2atXuanbo.top';
// 需要缓存的资源列表
const STATIC_ASSETS = [
  '/',
  '/ico.png',
  '/index.html',
  '/script.js',
  '/settings.html',
  '/style.css',
  '/theme.js',
  '/title.js','/UIsettings.js',
  'https://cdn.bootcdn.net/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
];

// 安装阶段：缓存所有静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('简·搜索: Log 正在缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
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
  
  // 只处理同源请求
  if (requestUrl.origin !== location.origin) {
    return;
  }
  
  // 检查请求是否在缓存列表中
  const shouldCache = STATIC_ASSETS.some(asset => {
    return requestUrl.pathname === asset || 
           (asset === '/' && requestUrl.pathname === '/index.html');
  });
  
  if (shouldCache) {
    // 对于静态资源，优先从缓存获取
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // 如果缓存中有，返回缓存内容
          if (cachedResponse) {
            return cachedResponse;
          }
          // 否则从网络获取
          return fetch(event.request);
        })
    );
  } else {
    // 对于API请求等不在缓存列表中的内容，直接从网络获取
    return;
  }
});
