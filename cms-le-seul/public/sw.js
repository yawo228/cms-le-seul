self.addEventListener('install', (e) => {
  console.log('SW installé');
});

self.addEventListener('fetch', (e) => {
  // Nécessaire pour valider les critères PWA de Chrome
});
