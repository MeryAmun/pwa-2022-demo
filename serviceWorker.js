
const staticCacheName = 'static-cache-v1'
const dynamicCacheName = 'site-dynamic-v1'
const assets =[
    '/',
    '/index.html',
    '/js/app.js',
    '/js/ui.js',
    '/css/styles.css',
    '/css/materialize.min.css',
    '/img/dish.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v121/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
    '/pages/fallback.html'
,
``]

// cache size limit function

const limitCacheSize = (name, size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if(keys.length > size){
                cache.delete(keys[0]).then(limitCacheSize(name, size))
            }
        })
    })
}

// install service worker
self.addEventListener('install', installEvt => {
    // console.log("Service worker has been installed")
    installEvt.waitUntil(
        caches.open(staticCacheName)
    .then((cache) => {
        console.log('caching shell assets')
cache.addAll(assets)
    })
    )
})
// activate service worker or listen for the activate event

self.addEventListener("activate", activateEvt => {
    // console.log("Service worker has been activated")
   
    activateEvt.waitUntil(
        caches.keys()
        .then((keys) => {
            return Promise.all(
                keys.filter(key => key !== staticCacheName && key !== dynamicCacheName) 
                .map(key => caches.delete(key))
                )
        })
    )
})
// FETCH EVENT
self.addEventListener('fetch',fetchEvt =>{
    //console.log("fetch", fetchEvt)
   if(fetchEvt.request.url.indexOf('firestore.googleapis.com') === -1 ){
    fetchEvt.respondWith(
        caches.match(fetchEvt.request)
        .then((cacheRes) => {
            return cacheRes || fetch(fetchEvt.request).then(fetchRes => {
                return caches.open(dynamicCacheName).then(cache =>{
                     cache.put(fetchEvt.request.url,fetchRes.clone())
                     limitCacheSize(dynamicCacheName, 15)
                     return fetchRes;
                    })
            })
        }).catch(() => {
           if(fetchEvt.request.url.indexOf('.html') > -1 ){
            return caches.match('/pages/fallback.html')
           }
        })
        )
   }

});