// Tăng số version mỗi khi cập nhật file để điện thoại tải bản mới
const V='tienich-v17';
const ASSETS=['./','index.html','style.css','app.js','tools.js','tools-more.js','history.js','tools-koda.js','koda-brain.js','koda-face.js','live.js','tools-fun.js','lunar.js','data.js','lib/qr.js','manifest.webmanifest','icons/icon-192.png','icons/icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.origin===location.origin){
    // ưu tiên mạng, mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(ca=>ca.put(r,c));return x}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
  }else if(u.host.endsWith('googleapis.com')||u.host.endsWith('gstatic.com')){
    e.respondWith(caches.open(V).then(async c=>{const m=await c.match(r);const n=fetch(r).then(x=>{c.put(r,x.clone());return x}).catch(()=>m);return m||n}));
  }
});
