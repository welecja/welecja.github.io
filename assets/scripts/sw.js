---
permalink: "/sw.js"
layout: null
sitemap: false
---

const version = '{{ site.time | date: '%Y%m%d%H%M%S' }}';
const cacheName = `static::${version}`;

const buildContentBlob = () => {
  return [
    {%- for post in site.posts limit: 10 -%}
      "{{ post.url | relative_url }}",
    {%- endfor -%}
    {%- comment -%}
      sitemap: false = strona spoza publicznego spisu; jej adres nie może trafić
      do cache'u, bo /sw.js jest jawny — potrzebne strony służbowe dopisujemy niżej
    {%- endcomment -%}
    {%- for page in site.pages -%}
      {%- unless page.url contains 'sw.js' or page.url contains '404.html' or page.sitemap == false -%}
        "{{ page.url | relative_url }}",
      {%- endunless -%}
    {%- endfor -%}
      "{{ '/offline/' | relative_url }}", "{{ '/manifest.json' | relative_url }}", "{{ '/assets/search.json' | relative_url }}", "{{ '/feed.xml' | relative_url }}",
      "{{ '/assets/logos/cyrkiel-sm.png' | relative_url }}",
      "{{ '/assets/logos/cyrkiel.svg' | relative_url }}",
      "{{ '/assets/logos/cyrkiel-favicon-48.png' | relative_url }}",
      "{{ '/assets/logos/cyrkiel-icon-180.png' | relative_url }}",
      "{{ '/assets/logos/cyrkiel-icon-192.png' | relative_url }}",
      "{{ '/assets/logos/cyrkiel-icon-512.png' | relative_url }}",
      "{{ '/assets/logos/cyrkiel-icon-maskable-512.png' | relative_url }}",
      "{{ site.logo | relative_url }}", "{{ site.baseurl }}/assets/default-offline-image.png", "{{ site.baseurl }}/assets/scripts/fetch.js"
  ]
}

const updateStaticCache = () => {
  return caches.open(cacheName).then(cache => {
    return cache.addAll(buildContentBlob());
  });
};

const clearOldCache = () => {
  return caches.keys().then(keys => {
    // Remove caches whose name is no longer valid.
    return Promise.all(
      keys
        .filter(key => {
          // Cache'e Śpiewnika (spiewnik-shell-*, spiewnik-media) należą do
          // osobnego service workera o węższym zakresie. Bez tego wyjątku każdy
          // build serwisu kasował komuś nagrania i nuty pobrane offline przed
          // wyjazdem — bo ten worker obejmuje całą domenę i sprząta wszystko,
          // co nie jest jego własnym cache'em.
          return key !== cacheName && key.indexOf('spiewnik-') !== 0;
        })
        .map(key => {
          console.log(`Service Worker: removing cache ${key}`);
          return caches.delete(key);
        })
    );
  });
};

self.addEventListener("install", event => {
  event.waitUntil(
    updateStaticCache().then(() => {
      console.log(`Service Worker: cache updated to version: ${cacheName}`);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(clearOldCache());
});

self.addEventListener("fetch", event => {
  let request = event.request;
  let url = new URL(request.url);

  // Only deal with requests from the same domain.
  if (url.origin !== location.origin) {
    return;
  }

  // Always fetch non-GET requests from the network.
  if (request.method !== "GET") {
    event.respondWith(fetch(request));
    return;
  }

  // Default url returned if page isn't cached
  let offlineAsset = "/offline/";

  if (request.url.match(/\.(jpe?g|png|gif|svg)$/)) {
    // If url requested is an image and isn't cached, return default offline image
    offlineAsset = "{{ site.baseurl }}/assets/default-offline-image.png";
  }

  // For all urls request image from network, then fallback to cache, then fallback to offline page
  event.respondWith(
    fetch(request).catch(async () => {
      return (await caches.match(request)) || caches.match(offlineAsset);
    })
  );
  return;
});
