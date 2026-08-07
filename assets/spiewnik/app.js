/* Śpiewnik jako aplikacja: panel ustawień (motyw, rozmiar tekstu, tryb
 * offline), rejestracja service workera i zachęta do instalacji.
 *
 * Adres Śpiewnika przychodzi atrybutem data-spiewnik-zakres ze znacznika
 * <script>, a nie jest wpisany w ten plik. Ten plik leży pod jawnym adresem
 * /assets/spiewnik/app.js i kto go otworzy, nie ma się z niego dowiedzieć,
 * pod jakim adresem stoi Śpiewnik.
 *
 * Motyw i rozmiar tekstu zapamiętuje i nakłada window.spiewnik ze skryptu
 * w nagłówku strony (_includes/spiewnik-head.html) — tam, bo ustawienie musi
 * stać na <html> przed pierwszym malowaniem. Tu jest tylko panel do nich.
 */
(function () {
  'use strict';

  var znacznik = document.querySelector('script[data-spiewnik-zakres]');
  var zakres = znacznik && znacznik.getAttribute('data-spiewnik-zakres');
  if (!zakres || location.pathname.indexOf(zakres) !== 0) return;

  var ust = window.spiewnik;
  var artykul = document.querySelector('article.article');

  // Pięć kroków od 85% do 150%. Mniej niż 85% robi z tekstu pieśni druk
  // ulotny, więcej niż 150% łamie dwuwierszowe refreny na telefonie.
  var ROZMIARY = [85, 100, 115, 130, 150];
  // Nagrania, nuty, PDF-y i skany archiwalne wskazane w spisie pieśni ważą
  // razem 136 MiB w 301 plikach — czyli około 143 MB tak, jak liczy je operator.
  // Liczbę podajemy okrągłą: dokładna zmieni się przy pierwszym dogranym
  // nagraniu, a tu chodzi o to, żeby ktoś na danych mobilnych wiedział, na co
  // się zgadza.
  var WAGA_MEDIOW = 'ok. 140 MB';

  var swObslugiwany = 'serviceWorker' in navigator;
  var swZawiodl = false;
  var rejestracja = null;

  var panel = null;
  var przelacznik = null;
  var stanShell = null;
  var stanMediow = null;
  var przyciskPobierz = null;
  var przyciskUsun = null;
  var wartoscRozmiaru = null;

  var mediaStan = null;   // odpowiedź SPIEWNIK_MEDIA_STATUS albo null, póki nie przyszła
  var postep = null;      // ostatnie SPIEWNIK_PROGRESS w trakcie pobierania
  var uwaga = '';         // jednorazowy dopisek po zakończonym pobieraniu lub usunięciu

  // ——— Ustawienia ———

  function indeksRozmiaru() {
    var najblizszy = 0;
    for (var i = 1; i < ROZMIARY.length; i++) {
      if (Math.abs(ROZMIARY[i] - ust.rozmiar) < Math.abs(ROZMIARY[najblizszy] - ust.rozmiar)) {
        najblizszy = i;
      }
    }
    return najblizszy;
  }

  function zbudujUstawienia() {
    if (!artykul || !ust) return null;
    var element = document.createElement('div');
    element.className = 'spiewnik-ust';
    element.innerHTML = '<button type="button" class="spiewnik-ust__przelacznik"'
      + ' aria-expanded="false" aria-controls="spiewnik-ust-panel">Ustawienia</button>'
      + '<div class="spiewnik-ust__panel" id="spiewnik-ust-panel" hidden>'

      + '<div class="spiewnik-ust__wiersz">'
      + '<span class="spiewnik-ust__etykieta" id="spiewnik-ust-motyw">Motyw</span>'
      + '<span class="spiewnik-ust__grupa" role="group" aria-labelledby="spiewnik-ust-motyw">'
      + '<button type="button" class="spiewnik-ust__opcja" data-motyw="auto">Auto</button>'
      + '<button type="button" class="spiewnik-ust__opcja" data-motyw="light">Jasny</button>'
      + '<button type="button" class="spiewnik-ust__opcja" data-motyw="dark">Ciemny</button>'
      + '</span>'
      + '</div>'

      + '<div class="spiewnik-ust__wiersz">'
      + '<span class="spiewnik-ust__etykieta" id="spiewnik-ust-rozmiar">Rozmiar tekstu</span>'
      + '<span class="spiewnik-ust__grupa" role="group" aria-labelledby="spiewnik-ust-rozmiar">'
      + '<button type="button" class="spiewnik-ust__opcja" data-krok="-1" aria-label="Mniejszy tekst">A&minus;</button>'
      + '<span class="spiewnik-ust__wartosc" aria-live="polite">100%</span>'
      + '<button type="button" class="spiewnik-ust__opcja" data-krok="1" aria-label="Większy tekst">A+</button>'
      + '</span>'
      + '</div>'

      + '<div class="spiewnik-ust__wiersz  spiewnik-ust__wiersz--offline">'
      + '<span class="spiewnik-ust__etykieta">Offline</span>'
      + '<span class="spiewnik-ust__offline">'
      + '<span class="spiewnik-ust__stan"></span>'
      + '<span class="spiewnik-ust__stan  spiewnik-ust__stan--media" aria-live="polite"></span>'
      + '<span class="spiewnik-ust__akcje">'
      + '<button type="button" class="button  spiewnik-ust__pobierz" hidden>Pobierz nuty i nagrania (' + WAGA_MEDIOW + ')</button>'
      + '<button type="button" class="spiewnik-ust__usun" hidden>Usuń pobrane</button>'
      + '</span>'
      + '</span>'
      + '</div>'

      + '</div>';

    panel = element.querySelector('.spiewnik-ust__panel');
    przelacznik = element.querySelector('.spiewnik-ust__przelacznik');
    stanShell = element.querySelector('.spiewnik-ust__stan');
    stanMediow = element.querySelector('.spiewnik-ust__stan--media');
    przyciskPobierz = element.querySelector('.spiewnik-ust__pobierz');
    przyciskUsun = element.querySelector('.spiewnik-ust__usun');
    wartoscRozmiaru = element.querySelector('.spiewnik-ust__wartosc');

    przelacznik.addEventListener('click', function () {
      var otwieramy = panel.hidden;
      panel.hidden = !otwieramy;
      przelacznik.setAttribute('aria-expanded', otwieramy ? 'true' : 'false');
      if (otwieramy) {
        // Dopisek potwierdza czynność sprzed chwili. Panel otwarty ponownie —
        // przy innej pieśni, kwadrans później — to już nie ta chwila.
        uwaga = '';
        // Stan cache'u sprawdzamy przy otwarciu, a nie przy wejściu na stronę:
        // przeliczenie trzystu wpisów nie ma się dziać przy każdej pieśni.
        zapytajOMedia();
      }
    });

    // Escape i kliknięcie obok zamykają panel. Panel przykrywa początek pieśni,
    // a na telefonie zamknięcie go inaczej niż trafieniem w ten sam mały napis
    // nie jest oczywiste.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      if (zamknijPanel()) przelacznik.focus();
    });

    document.addEventListener('click', function (e) {
      if (!panel || panel.hidden) return;
      // Przełącznik ma dalej działać: jego własna obsługa właśnie panel
      // otworzyła, a to zdarzenie jest tym samym kliknięciem w drodze w górę.
      if (panel.contains(e.target) || przelacznik.contains(e.target)) return;
      zamknijPanel();
    });

    element.querySelectorAll('[data-motyw]').forEach(function (przycisk) {
      przycisk.addEventListener('click', function () {
        ust.zapisz(przycisk.getAttribute('data-motyw'), ust.rozmiar);
        odswiezWybory();
      });
    });

    element.querySelectorAll('[data-krok]').forEach(function (przycisk) {
      przycisk.addEventListener('click', function () {
        var i = indeksRozmiaru() + parseInt(przycisk.getAttribute('data-krok'), 10);
        if (i < 0 || i >= ROZMIARY.length) return;
        ust.zapisz(ust.motyw, ROZMIARY[i]);
        odswiezWybory();
      });
    });

    przyciskPobierz.addEventListener('click', function () {
      uwaga = '';
      postep = null;
      if (doSw({ type: 'SPIEWNIK_DOWNLOAD_ALL' })) {
        postep = { done: 0, total: mediaStan ? mediaStan.total : 0 };
      }
      odswiezOffline();
    });

    przyciskUsun.addEventListener('click', function () {
      uwaga = '';
      doSw({ type: 'SPIEWNIK_CLEAR_MEDIA' });
      odswiezOffline();
    });

    artykul.insertBefore(element, artykul.firstChild);
    odswiezWybory();
    odswiezOffline();
    return element;
  }

  /** Zamyka panel; zwraca true, jeżeli było co zamykać. */
  function zamknijPanel() {
    if (!panel || panel.hidden) return false;
    panel.hidden = true;
    przelacznik.setAttribute('aria-expanded', 'false');
    return true;
  }

  /** Zaznacza w panelu to, co jest teraz ustawione. */
  function odswiezWybory() {
    if (!panel) return;
    panel.querySelectorAll('[data-motyw]').forEach(function (przycisk) {
      var wybrany = przycisk.getAttribute('data-motyw') === ust.motyw;
      przycisk.setAttribute('aria-pressed', wybrany ? 'true' : 'false');
    });
    var i = indeksRozmiaru();
    wartoscRozmiaru.textContent = ROZMIARY[i] + '%';
    panel.querySelector('[data-krok="-1"]').disabled = i === 0;
    panel.querySelector('[data-krok="1"]').disabled = i === ROZMIARY.length - 1;
  }

  // ——— Tryb offline ———

  /** Service worker, do którego można mówić, albo null. */
  function doSw(wiadomosc) {
    var cel = (swObslugiwany && navigator.serviceWorker.controller)
      || (rejestracja && rejestracja.active);
    if (!cel) return false;
    cel.postMessage(wiadomosc);
    return true;
  }

  function zapytajOMedia() {
    if (!doSw({ type: 'SPIEWNIK_MEDIA_STATUS' })) odswiezOffline();
  }

  function gotowy() {
    return !!((swObslugiwany && navigator.serviceWorker.controller)
      || (rejestracja && rejestracja.active));
  }

  function tekstMediow() {
    if (postep) return 'Pobieranie… ' + postep.done + '/' + postep.total;
    if (mediaStan === null) return 'Sprawdzanie pobranych nut i nagrań…';
    if (mediaStan.error) return 'Nie udało się odczytać spisu nagrań — spróbuj przy połączeniu z siecią.';
    if (!mediaStan.total) return 'Spis nie wskazuje żadnych nut ani nagrań.';
    if (mediaStan.cached >= mediaStan.total) return 'Nuty i nagrania są pobrane.';
    if (!mediaStan.cached) return 'Nuty i nagrania nie są pobrane.';
    return 'Pobrano ' + mediaStan.cached + ' z ' + mediaStan.total + ' plików z nutami i nagraniami.';
  }

  function odswiezOffline() {
    if (!stanShell) return;

    if (!swObslugiwany || swZawiodl) {
      stanShell.textContent = swObslugiwany
        ? 'Nie udało się przygotować Śpiewnika do czytania bez sieci.'
        : 'Ta przeglądarka nie umie zapisać Śpiewnika do czytania bez sieci.';
      stanMediow.hidden = true;
      przyciskPobierz.hidden = true;
      przyciskUsun.hidden = true;
      return;
    }

    if (!gotowy()) {
      stanShell.textContent = 'Trwa zapisywanie tekstów i stron śpiewnika do czytania bez sieci.';
      stanMediow.hidden = true;
      przyciskPobierz.hidden = true;
      przyciskUsun.hidden = true;
      return;
    }

    stanShell.textContent = 'Teksty i strony śpiewnika działają offline.';
    stanMediow.hidden = false;
    stanMediow.textContent = uwaga ? tekstMediow() + ' ' + uwaga : tekstMediow();

    var znanySpis = mediaStan !== null && !mediaStan.error && mediaStan.total > 0;
    przyciskPobierz.hidden = !!postep || !znanySpis || mediaStan.cached >= mediaStan.total;
    przyciskUsun.hidden = !!postep || !znanySpis || mediaStan.cached === 0;
  }

  // Panel wstawiamy przed dotknięciem service workera. Odwrotna kolejność
  // znaczyłaby, że przeglądarka, która się na service workerze wywraca, zabiera
  // przy okazji ustawienia motywu i rozmiaru tekstu — a te z siecią nie mają
  // nic wspólnego.
  zbudujUstawienia();

  if (swObslugiwany) {
    navigator.serviceWorker.addEventListener('message', function (e) {
      var dane = e.data || {};
      if (dane.type === 'SPIEWNIK_PROGRESS') {
        postep = dane;
      } else if (dane.type === 'SPIEWNIK_DONE') {
        postep = null;
        if (dane.error) {
          uwaga = 'Nie udało się odczytać spisu nagrań — spróbuj przy połączeniu z siecią.';
        } else {
          if (dane.failed) {
            uwaga = 'Części plików nie udało się pobrać — spróbuj ponownie przy lepszym połączeniu.';
          }
          // Wynik pobierania wstawiamy w tym samym renderze, w którym znika
          // pasek postępu. Inaczej między „Pobieranie… 296/296” a odpowiedzią
          // na SPIEWNIK_MEDIA_STATUS wiersz zdążył pokazać pomiar sprzed
          // pobierania, czyli „nie są pobrane” tuż po pobraniu wszystkiego.
          mediaStan = { cached: dane.done - dane.failed, total: dane.total };
        }
        zapytajOMedia(); // liczby potwierdzamy potem cache'em, nie przebiegiem pobierania
      } else if (dane.type === 'SPIEWNIK_MEDIA_STATUS') {
        mediaStan = dane;
      } else if (dane.type === 'SPIEWNIK_CLEARED') {
        mediaStan = dane;
        uwaga = 'Pobrane pliki zostały usunięte.';
      } else {
        return;
      }
      odswiezOffline();
    });

    navigator.serviceWorker.register(zakres + 'sw.js', { scope: zakres })
      .then(function (r) {
        rejestracja = r;
        odswiezOffline();
      })
      .catch(function (err) {
        console.warn('Śpiewnik: nie udało się zarejestrować service workera', err);
        swZawiodl = true;
        odswiezOffline();
      });

    navigator.serviceWorker.ready.then(function (r) {
      rejestracja = r;
      odswiezOffline();
      if (panel && !panel.hidden) zapytajOMedia();
    });
  }

  // Motyw „Auto” ma iść za ustawieniem telefonu także wtedy, gdy zmieni się ono
  // przy otwartej stronie — o zmierzchu, przy oglądaniu tej samej pieśni.
  var ciemnySystem = window.matchMedia('(prefers-color-scheme: dark)');
  if (ust && ciemnySystem.addEventListener) {
    ciemnySystem.addEventListener('change', function () {
      if (ust.motyw === 'auto') ust.zastosuj();
    });
  }

  // ——— Zachęta do instalacji ———

  // Zachęta stoi wyłącznie na spisie pieśni. Na stronie pojedynczej pieśni ktoś
  // przyszedł po tekst, a nie po ofertę instalacji.
  if (location.pathname !== zakres) return;

  var KLUCZ_UKRYCIA = 'spiewnik-instalacja-ukryta';
  var waskie = window.matchMedia('(max-width: 820px)');
  var zdarzenie = null;
  var pasek = null;

  function ukryte() {
    try {
      return localStorage.getItem(KLUCZ_UKRYCIA) === '1';
    } catch (err) {
      return false; // tryb prywatny odmawia dostępu do localStorage
    }
  }

  function zainstalowany() {
    return window.matchMedia('(display-mode: standalone)').matches
      || navigator.standalone === true;
  }

  // Safari na iPhonie nie zna beforeinstallprompt — tam zostaje instrukcja.
  function iPhone() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function zbuduj() {
    if (!artykul) return null;
    var element = document.createElement('div');
    element.className = 'spiewnik-install';
    element.hidden = true;
    element.innerHTML = '<div class="spiewnik-install__body">'
      + '<p class="spiewnik-install__text">Śpiewnik działa też jako aplikacja — z tekstami dostępnymi offline.</p>'
      + '<p class="spiewnik-install__hint" hidden>Na iPhonie: Udostępnij, potem «Do ekranu początkowego».</p>'
      + '</div>'
      + '<button type="button" class="button spiewnik-install__go" hidden>Zainstaluj aplikację</button>'
      + '<button type="button" class="spiewnik-install__close" aria-label="Zamknij">×</button>';

    element.querySelector('.spiewnik-install__go').addEventListener('click', function () {
      var zaproszenie = zdarzenie;
      zdarzenie = null;
      element.hidden = true;
      if (zaproszenie) zaproszenie.prompt();
    });
    element.querySelector('.spiewnik-install__close').addEventListener('click', function () {
      element.hidden = true;
      try {
        localStorage.setItem(KLUCZ_UKRYCIA, '1');
      } catch (err) { /* bez pamięci zniknie tylko do końca odwiedzin */ }
    });

    // Pod przyciskiem ustawień, nie nad nim: ustawienia są stałym elementem
    // strony, a zachęta gościem, który po zamknięciu znika.
    var ustawienia = artykul.querySelector('.spiewnik-ust');
    artykul.insertBefore(element, ustawienia ? ustawienia.nextSibling : artykul.firstChild);
    return element;
  }

  function odswiez() {
    // Przeglądarka, która ani nie umie zaprosić do instalacji, ani nie da się
    // poprowadzić ręcznie, nie ma tu nic do powiedzenia — i paska nie ma.
    var warto = !ukryte() && !zainstalowany() && waskie.matches
      && (zdarzenie !== null || iPhone());
    if (!warto) {
      if (pasek) pasek.hidden = true;
      return;
    }
    if (!pasek) pasek = zbuduj();
    if (!pasek) return;
    pasek.querySelector('.spiewnik-install__go').hidden = zdarzenie === null;
    pasek.querySelector('.spiewnik-install__hint').hidden = zdarzenie !== null;
    pasek.hidden = false;
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    zdarzenie = e;
    odswiez();
  });

  window.addEventListener('appinstalled', function () {
    zdarzenie = null;
    if (pasek) pasek.hidden = true;
  });

  if (waskie.addEventListener) waskie.addEventListener('change', odswiez);

  odswiez();
})();
