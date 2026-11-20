// Service worker do Fit: busca da internet primeiro (pra pegar atualizações)
// e usa o cache quando estiver sem internet.
const CACHE = 'fit-v5';
const ARQUIVOS = ['./', 'index.html', 'frango3d.js', 'recursos.js', 'ferramentas.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});

// Lembrete de treino em segundo plano (quando o Android libera a sincronização periódica)
self.addEventListener('periodicsync', e => {
  if (e.tag !== 'lembretes') return;
  e.waitUntil((async () => {
    try {
      const c = await caches.open('fit-config'), r = await c.match('config-lembretes'); if (!r) return;
      const cfg = await r.json(), agora = new Date(), hoje = agora.toISOString().slice(0, 10);
      const hm = String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0');
      if (!cfg.ativo || hm < cfg.treino || cfg.avisado === hoje || (cfg.data === hoje && cfg.treinouHoje)) return;
      cfg.avisado = hoje; await c.put('config-lembretes', new Response(JSON.stringify(cfg)));
      await self.registration.showNotification('Hora do treino! 💪', {body: 'Seu frango está esperando 🐔', tag: 'treino', icon: 'icon-192.png'});
    } catch (err) {}
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window'}).then(l => l.length ? l[0].focus() : self.clients.openWindow('./')));
});
