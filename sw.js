const CACHE_NAME = 'codekids-wedo-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './icon.svg',
  './js/main.js',
  './js/blockly_setup.js',
  './js/audio_manager.js',
  './js/drivers/wedo_driver.js',
  './js/drivers/arduino_driver.js',
  './js/blocks/custom_blocks.js',
  'https://unpkg.com/blockly@10.4.3/blockly_compressed.js',
  'https://unpkg.com/blockly@10.4.3/blocks_compressed.js',
  'https://unpkg.com/blockly@10.4.3/msg/pt-br.js',
  'https://unpkg.com/blockly@10.4.3/javascript_compressed.js',
  'https://unpkg.com/@blockly/field-colour/dist/index.js',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
