/* Facturas MORELEC - service worker */
var CACHE = "morelec-v3";
var FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.allSettled(FILES.map(function(f){ return c.add(f); }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function esHTML(req){
  return req.mode === "navigate" || (req.headers.get("accept")||"").indexOf("text/html") > -1;
}

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  if(esHTML(e.request)){
    // primero red (para recibir actualizaciones), cache si no hay internet
    e.respondWith(
      fetch(e.request).then(function(res){
        var copia = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copia); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match(e.request, {ignoreSearch:true}).then(function(hit){
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, {ignoreSearch:true}).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        var copia = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copia); }).catch(function(){});
        return res;
      });
    })
  );
});
