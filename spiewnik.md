---
title: Śpiewnik
permalink: /bardzo-tajny-link-do-spiewnika-haslo1883/
sitemap: false
indexing: false
excerpt: "Śpiewnik Welecki — nagrania, nuty i teksty pieśni oficjalnych i towarzyskich Korporacji Akademickiej Welecja."
---

<a href="{{ '/dla-weletow/' | relative_url }}">&larr; Portal Welecki</a>

Pieśń od zawsze towarzyszy życiu korporacyjnemu — od uroczystych kwater po komersze. Poniżej znajduje się spis pieśni ze Śpiewnika Weleckiego; przy każdej pieśni dostępne są nagranie, nuty oraz tekst.

<div class="song-search">
  <input class="song-search__input" id="song-search" type="search" placeholder="Szukaj — tytuł lub fragment tekstu…" oninput="filtrujPiesni()" autocomplete="off">
  <p class="song-search__none" id="song-search-none" hidden>Brak pieśni pasujących do wyszukiwania.</p>
</div>

{% assign oficjalne = site.pages | where: "song", true | where: "section", "oficjalne" | sort: "order" %}
{% assign towarzyskie = site.pages | where: "song", true | where: "section", "towarzyskie" | sort: "order" %}

<div class="song-section">
  <h2>Pieśni oficjalne</h2>
  <ul class="song-list">
    {% for song in oficjalne %}<li data-s="{{ song.title | escape }} {{ song.lyrics | escape }}"><a href="{{ song.url | relative_url }}">{{ song.title }}</a></li>
    {% endfor %}
  </ul>
</div>

<div class="song-section">
  <h2>Pieśni towarzyskie</h2>
  <ul class="song-list">
    {% for song in towarzyskie %}<li data-s="{{ song.title | escape }} {{ song.lyrics | escape }}"><a href="{{ song.url | relative_url }}">{{ song.title }}</a></li>
    {% endfor %}
  </ul>
</div>

<p class="song__copyright">Nagrania, nuty i teksty: © Korporacja Akademicka Welecja. Wszelkie prawa zastrzeżone.</p>

<style>
  .song-search { margin: 1.6rem 0; max-width: 30rem; }
  .song-search__input {
    display: block; width: 100%; padding: .55rem .8rem;
    font: inherit; border: 1px solid #ccc; border-radius: 2px;
  }
  .song-search__input:focus { outline: none; border-color: #005248; }
  .song-search__none { color: #666; margin-top: .8rem; }
  .song-list { list-style: none; padding-left: 0; }
  .song-list li { margin: .3rem 0; }
  .song__copyright { margin-top: 2.8rem; font-size: .8em; color: #888; }
</style>
<script>
  // wyszukiwarka: tytuły + pełne teksty pieśni; ó/ę/ł itd. sprowadzane do ASCII,
  // więc zapytanie bez polskich znaków też trafia
  function normalizuj(s) {
    return s.toLowerCase().replace(/ł/g, 'l')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function filtrujPiesni() {
    var q = normalizuj(document.getElementById('song-search').value);
    var total = 0;
    document.querySelectorAll('.song-section').forEach(function (sec) {
      var visible = 0;
      sec.querySelectorAll('li[data-s]').forEach(function (li) {
        if (li._s === undefined) li._s = normalizuj(li.getAttribute('data-s'));
        var show = !q || li._s.indexOf(q) !== -1;
        li.hidden = !show;
        if (show) visible++;
      });
      sec.hidden = visible === 0;
      total += visible;
    });
    document.getElementById('song-search-none').hidden = total > 0 || !q;
  }
  var q0 = new URLSearchParams(window.location.search).get('q');
  if (q0) {
    document.getElementById('song-search').value = q0;
    filtrujPiesni();
  }
</script>
