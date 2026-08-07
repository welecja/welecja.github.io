---
permalink: /spiewnik-viribus-unitis-1883/sw.js
sitemap: false
indexing: false
layout: null
---
{%- comment -%}
  Lista powłoki powstaje z nagłówków pieśni, a nie z ręcznego spisu: dopisanie
  pieśni do spiewnik/ ma ją od razu włączyć do wersji offline. Ręczny spis był
  trzecim miejscem, w którym trzeba by zarejestrować nową pieśń — i tym, które
  znajduje się ostatnie, bo pominięte daje pieśń działającą wyłącznie online.
{%- endcomment -%}
{%- assign baza = '/spiewnik-viribus-unitis-1883/' | relative_url -%}
{%- assign piesni = site.pages | where: "song", true -%}
/* Śpiewnik offline.
 *
 * Powłoka — spis, strony pieśni z tekstami, dane i ikony — jest pobierana przy
 * instalacji, więc Śpiewnik otwiera się bez zasięgu. Nagrania, nuty i PDF-y to
 * kilkaset megabajtów; trafiają do cache'u dopiero wtedy, gdy ktoś je otworzy,
 * albo hurtem na żądanie (SPIEWNIK_DOWNLOAD_ALL) — przed wyjazdem, póki jeszcze
 * jest z czego pobierać.
 *
 * Dwa cache'e, nie jeden. Wspólny znaczyłby, że poprawiona literówka w tekście
 * jednej pieśni kasuje komuś nagrania zapisane specjalnie na komers w miejscu
 * bez zasięgu. spiewnik-media przeżywa więc każdą zmianę wersji powłoki.
 */
const WERSJA = '{{ site.time | date: '%s' }}';
const POWLOKA_V = 'spiewnik-shell-' + WERSJA;
const MEDIA_V = 'spiewnik-media';
const ZAKRES = new URL('./', self.registration.scope).pathname;
const SONGS = {{ baza | append: 'songs.json' | jsonify }};
const MANIFEST = {{ baza | append: 'manifest.json' | jsonify }};

/* Nagrania, nuty i PDF-y. Rozpoznawane po tym, gdzie leżą, a nie po spisie
 * nazw — plik dorzucony do pieśni ma działać bez zmiany w tym pliku. */
const MEDIA = [
  {{ '/assets/audio/' | relative_url | jsonify }},
  {{ '/assets/images/spiewnik/' | relative_url | jsonify }},
  {{ '/assets/documents/spiewnik/' | relative_url | jsonify }}
];

const POWLOKA = [
  {{ baza | jsonify }},
  {{ baza | append: 'o-spiewniku/' | jsonify }},
  {{ baza | append: 'songs.json' | jsonify }},
  {{ baza | append: 'manifest.json' | jsonify }},
  {{ '/assets/spiewnik/app.css' | relative_url | jsonify }},
  {{ '/assets/spiewnik/app.js' | relative_url | jsonify }},
  {{ '/assets/logos/spiewnik-icon-192.png' | relative_url | jsonify }},
  {{ '/assets/logos/spiewnik-icon-512.png' | relative_url | jsonify }},
  {{ '/assets/logos/spiewnik-icon-180.png' | relative_url | jsonify }},
  {{ '/assets/logos/spiewnik-icon-maskable-512.png' | relative_url | jsonify }},
{%- comment -%}
  Herb w nagłówku i cyrkiel przed tytułem stoją na każdej stronie Śpiewnika —
  herb znacznikiem <img>, cyrkiel tłem nagłówka z arkusza. Oba leżą poza
  /assets/audio|images/spiewnik|documents, więc nie łapie ich reguła mediów i
  bez tych dwóch wierszy offline zostawały puste ramki.
{%- endcomment %}
  {{ '/assets/logos/herb.png' | relative_url | jsonify }},
  {{ '/assets/logos/cyrkiel-sm.png' | relative_url | jsonify }},
{%- comment -%}
  Przy css_inline: true arkusz jest wklejony w <style> każdej strony i nie ma
  czego pobierać osobno; po przełączeniu na plik trzeba go mieć w powłoce, bo
  inaczej Śpiewnik otwiera się offline bez żadnych stylów. Kroje pisma idą
  z fonts.googleapis.com — cudzy adres, nie nasz cache.
{%- endcomment -%}
{%- unless site.css_inline == true %}
  {{ '/assets/styles.css' | relative_url | jsonify }},
{%- endunless %}
{%- for piesn in piesni %}
  {{ piesn.url | relative_url | jsonify }}{% unless forloop.last %},{% endunless %}
{%- endfor %}
];
const W_POWLOCE = new Set(POWLOKA);

/** Czego się spodziewamy pod danym adresem. Samo 200 nie wystarcza: strona
 *  logowania do hotelowego wi-fi odpowiada tak samo na każde żądanie. */
function typDla(sciezka) {
  const s = String(sciezka || '').toLowerCase();
  if (s.endsWith('.js')) return 'application/javascript';
  if (s.endsWith('.css')) return 'text/css';
  if (s.endsWith('.json')) return 'application/json';
  if (s.endsWith('.png')) return 'image/png';
  if (s.endsWith('.jpg') || s.endsWith('.jpeg')) return 'image/jpeg';
  if (s.endsWith('.mp3')) return 'audio/mpeg';
  if (s.endsWith('.pdf')) return 'application/pdf';
  return 'text/html';
}

function ok(r, oczekiwany) {
  if (!r || !r.ok || r.type === 'opaque') return false;
  const jest = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!jest) return true; // część serwerów statycznych nie mówi nic
  if (oczekiwany === 'application/javascript') return /javascript|ecmascript/.test(jest);
  if (oczekiwany === 'application/json') return /json|manifest/.test(jest);
  if (oczekiwany === 'audio/mpeg') return jest.indexOf('audio/') === 0;
  return jest === oczekiwany;
}

/* Strona logowania do sieci też jest HTML-em i też ma status 200. Każda strona
 * Śpiewnika odsyła do własnego manifestu i żadna cudza strona tego nie robi —
 * to wystarczający dowód, żeby zapisać ją jako Śpiewnik. */
async function stronaSpiewnikaOk(r) {
  if (!ok(r, 'text/html')) return false;
  try {
    return (await r.clone().text()).indexOf(MANIFEST) !== -1;
  } catch (e) {
    return false;
  }
}

function jestMedia(sciezka) {
  return MEDIA.some(function (przedrostek) { return sciezka.indexOf(przedrostek) === 0; });
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const bylo = (await caches.keys()).includes(POWLOKA_V);
    const cache = await caches.open(POWLOKA_V);
    // Po jednym pliku, bo cache.addAll() jest wszystko-albo-nic na stu
    // dwudziestu adresach: jedna pieśń, której akurat nie ma — przerwany
    // deploy, CDN bez świeżej kopii — wywracała instalację całego Śpiewnika,
    // skipWaiting() nigdy nie dochodziło do skutku i pierwsza rejestracja szła
    // do kosza. Brak jednej pieśni to nie powód, żeby nie było pozostałych.
    await Promise.all(POWLOKA.map(async (adres) => {
      try {
        const oczekiwany = typDla(adres);
        const r = await fetch(adres, { cache: 'reload' });
        if (!ok(r, oczekiwany)) throw new Error('nieoczekiwana odpowiedź');
        // Instalacja przy hotelowym wi-fi zapisałaby sto dziesięć kopii ekranu
        // logowania jako sto dziesięć pieśni, i to na wersję powłoki.
        if (oczekiwany === 'text/html' && !(await stronaSpiewnikaOk(r))) {
          throw new Error('to nie jest strona Śpiewnika');
        }
        await cache.put(adres, r);
      } catch (err) {
        console.warn('spiewnik: nie zapisano ' + adres, err);
      }
    }));
    // caches.open() utworzył cache, zanim cokolwiek pobraliśmy. Jeżeli nie
    // wpadło do niego nic — instalacja bez sieci — to pusty cache pod aktualną
    // nazwą jest powłoką, która na nic nie odpowiada i której activate nigdy
    // nie sprzątnie, bo aktualna nazwa to dokładnie ta, którą zachowuje.
    if (!bylo && (await cache.keys()).length === 0) await caches.delete(POWLOKA_V);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const nazwa of await caches.keys()) {
      // Tylko własne cache'e powłoki. spiewnik-media zostaje: nagrania
      // ściągnięte przed komersem nie mają nic wspólnego z wersją strony.
      if (nazwa.indexOf('spiewnik-shell-') === 0 && nazwa !== POWLOKA_V) {
        await caches.delete(nazwa);
      }
    }
    await self.clients.claim();
  })());
});

/* Nagranie w <audio> przychodzi z nagłówkiem Range. Chrome zadowala się pełną
 * odpowiedzią 200 z cache'u, ale Safari na iPhonie odmawia odtworzenia czegoś,
 * o co poprosiło zakresem, a dostało w całości — czyli offline nie działa
 * dokładnie tam, gdzie najczęściej jest potrzebny. Zakres wycinamy więc sami.
 * Odpowiedzi 206 z sieci nie zapisujemy: cache.put() ich nie przyjmuje. */
async function zZakresu(zapisany, naglowek) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(naglowek).trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  const bufor = await zapisany.arrayBuffer();
  const calosc = bufor.byteLength;
  let poczatek;
  let koniec;
  if (m[1] === '') {
    poczatek = Math.max(0, calosc - parseInt(m[2], 10));
    koniec = calosc - 1;
  } else {
    poczatek = parseInt(m[1], 10);
    koniec = m[2] === '' ? calosc - 1 : Math.min(parseInt(m[2], 10), calosc - 1);
  }
  const naglowki = new Headers(zapisany.headers);
  naglowki.set('Accept-Ranges', 'bytes');
  if (!(poczatek >= 0) || poczatek > koniec) {
    naglowki.set('Content-Range', 'bytes */' + calosc);
    return new Response(null, { status: 416, headers: naglowki });
  }
  naglowki.set('Content-Range', 'bytes ' + poczatek + '-' + koniec + '/' + calosc);
  naglowki.set('Content-Length', String(koniec - poczatek + 1));
  return new Response(bufor.slice(poczatek, koniec + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: naglowki
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Nagrania, nuty i PDF-y: najpierw cache, bo raz pobrane się nie zmieniają,
  // a to one są powodem, dla którego ktoś w ogóle instaluje Śpiewnik.
  if (jestMedia(url.pathname)) {
    const zakres = req.headers.get('range');
    e.respondWith((async () => {
      const cache = await caches.open(MEDIA_V);
      const zapisany = await cache.match(url.href);
      if (zapisany) {
        if (!zakres) return zapisany;
        const czesc = await zZakresu(zapisany, zakres);
        if (czesc) return czesc;
        return zapisany;
      }
      const r = await fetch(req);
      // Odpowiedź na żądanie zakresowe jest częściowa i cache jej nie przyjmie
      // — pełną kopię wkłada tu pierwsze zwykłe żądanie albo pobieranie hurtem.
      if (!zakres && ok(r, typDla(url.pathname))) {
        cache.put(url.href, r.clone()).catch(() => {});
      }
      return r;
    })());
    return;
  }

  // Nawigacja pod adresem Śpiewnika, dowolne ?q=… — bez ignoreSearch szukanie
  // w spisie kończyłoby się offline pustą stroną.
  const nawigacja = req.mode === 'navigate' && url.pathname.indexOf(ZAKRES) === 0;
  if (!nawigacja && !W_POWLOCE.has(url.pathname)) return; // reszta serwisu nie jest nasza

  const klucz = nawigacja ? url.origin + url.pathname : req;
  const oczekiwany = typDla(url.pathname);
  e.respondWith(
    caches.open(POWLOKA_V).then((cache) => cache.match(klucz).then((zapisany) => {
      // Stale while revalidate: natychmiast z cache'u, ale poprawiony tekst
      // pieśni trafia na ekran przy następnym wejściu, a nie nigdy.
      const siec = fetch(req).then(async (r) => {
        if (!ok(r, oczekiwany)) return zapisany || r;
        if (nawigacja && !(await stronaSpiewnikaOk(r))) return zapisany || r;
        cache.put(klucz, r.clone()).catch(() => {});
        return r;
      }).catch(async () => {
        if (zapisany) return zapisany;
        // Nawigacja pod adres, którego nigdy nie zapisaliśmy — pieśń dodana po
        // instalacji, odsyłacz z literówką. Bez sieci przeglądarka pokazałaby
        // wtedy własny ekran błędu; zapisany spis pieśni jest miejscem, z
        // którego da się dojść dalej.
        if (nawigacja) {
          const spis = await cache.match(location.origin + ZAKRES);
          if (spis) return spis;
        }
        return Response.error();
      });
      return zapisany || siec;
    }))
  );
});

/* Lista pieśni albo NULL, jeżeli nie dało się jej przeczytać.
 *
 * Różnica jest istotna: pusta lista z nieudanego odczytu znaczyłaby "nie ma
 * żadnych nagrań", a na tej podstawie kasujemy i liczymy cache mediów. Jedna
 * błędna odpowiedź — połowiczny deploy, strona logowania podana jako JSON —
 * skasowałaby komuś megabajty pobrane specjalnie przed wyjazdem. */
async function czytajPiesni() {
  const sprawdz = async (r) => {
    if (!ok(r, 'application/json')) throw new Error('to nie jest songs.json');
    const dane = await r.json();
    if (!dane || !Array.isArray(dane.songs)) throw new Error('brak listy pieśni');
    return dane;
  };
  try {
    const r = await fetch(SONGS, { cache: 'no-cache' });
    return await sprawdz(r);
  } catch (e) { /* brak sieci albo odpowiedź, która nie jest listą pieśni */ }
  try {
    const zapisany = await caches.match(SONGS);
    if (zapisany) return await sprawdz(zapisany);
  } catch (e) { /* zapisana kopia też nią nie jest */ }
  return null;
}

/** Każde nagranie, nuty, PDF i skan archiwalny ze spisu, bez powtórzeń. */
async function adresyMediow() {
  const dane = await czytajPiesni();
  if (!dane) return null;
  const widziane = new Set();
  const dodaj = (wartosc) => {
    if (typeof wartosc !== 'string' || !wartosc) return;
    let u;
    try {
      u = new URL(wartosc, location.href);
    } catch (err) {
      return;
    }
    // Adresy z pliku danych traktujemy jak cudze: do cache'u trafia wyłącznie
    // to, co leży tam, gdzie materiały Śpiewnika.
    if (u.origin !== location.origin || !jestMedia(u.pathname)) return;
    widziane.add(u.href);
  };
  for (const piesn of dane.songs) {
    for (const nagranie of piesn.recordings || []) dodaj(nagranie && nagranie.src);
    for (const nuty of piesn.scores || []) dodaj(nuty);
    // Skany archiwalne to jedyne, co przy części pieśni w ogóle jest do
    // obejrzenia — pominięte tutaj zostawały poza pobieraniem hurtem.
    for (const skan of piesn.archiwalia || []) dodaj(skan);
    dodaj(piesn.pdf);
  }
  return Array.from(widziane);
}

self.addEventListener('message', (e) => {
  const rodzaj = e.data && e.data.type;
  const klient = e.source;
  const powiedz = (wiadomosc) => {
    try {
      if (klient && klient.postMessage) klient.postMessage(wiadomosc);
    } catch (err) { /* karta mogła się zamknąć w trakcie pobierania */ }
  };

  if (rodzaj === 'SPIEWNIK_DOWNLOAD_ALL') {
    e.waitUntil((async () => {
      const adresy = await adresyMediow();
      if (!adresy) {
        powiedz({ type: 'SPIEWNIK_DONE', done: 0, total: 0, failed: 0, error: 'brak-listy' });
        return;
      }
      const cache = await caches.open(MEDIA_V);
      const total = adresy.length;
      let done = 0;
      let failed = 0;
      for (const adres of adresy) {
        try {
          const oczekiwany = typDla(new URL(adres).pathname);
          const zapisany = await cache.match(adres);
          if (!ok(zapisany, oczekiwany)) {
            const r = await fetch(adres, { cache: 'reload' });
            if (!ok(r, oczekiwany)) throw new Error('nieoczekiwana odpowiedź');
            await cache.put(adres, r);
          }
        } catch (err) {
          failed++; // jedne brakujące nuty nie mogą przerwać całej reszty
        }
        done++;
        powiedz({ type: 'SPIEWNIK_PROGRESS', done, total }); // setki megabajtów na słabym zasięgu muszą pokazywać ruch
      }
      powiedz({ type: 'SPIEWNIK_DONE', done, total, failed });
    })());
    return;
  }

  if (rodzaj === 'SPIEWNIK_CLEAR_MEDIA') {
    e.waitUntil((async () => {
      await caches.delete(MEDIA_V);
      const adresy = await adresyMediow();
      powiedz({ type: 'SPIEWNIK_CLEARED', cached: 0, total: adresy ? adresy.length : 0 });
    })());
    return;
  }

  if (rodzaj === 'SPIEWNIK_MEDIA_STATUS') {
    e.waitUntil((async () => {
      const adresy = await adresyMediow();
      if (!adresy) {
        powiedz({ type: 'SPIEWNIK_MEDIA_STATUS', cached: 0, total: 0, error: 'brak-listy' });
        return;
      }
      let cached = 0;
      if ((await caches.keys()).includes(MEDIA_V)) {
        const cache = await caches.open(MEDIA_V);
        for (const adres of adresy) {
          if (await cache.match(adres)) cached++;
        }
      }
      powiedz({ type: 'SPIEWNIK_MEDIA_STATUS', cached, total: adresy.length });
    })());
  }
});
