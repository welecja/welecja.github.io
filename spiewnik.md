---
title: Śpiewnik
permalink: /bardzo-tajny-link-do-spiewnika-haslo1883/
sitemap: false
indexing: false
excerpt: "Śpiewnik Welecki — nagrania, nuty i teksty pieśni oficjalnych i towarzyskich Korporacji Akademickiej Welecja."
---

Pieśń od zawsze towarzyszy życiu korporacyjnemu — od uroczystych kwater po komersze. Poniżej znajduje się spis pieśni ze Śpiewnika Weleckiego; przy każdej pieśni dostępne są nagranie, nuty oraz tekst.

## Pieśni oficjalne

{% assign oficjalne = site.pages | where: "song", true | where: "section", "oficjalne" | sort: "order" %}
<ul class="song-list">
{% for song in oficjalne %}  <li><a href="{{ song.url | relative_url }}">{{ song.title }}</a></li>
{% endfor %}</ul>

## Pieśni towarzyskie

{% assign towarzyskie = site.pages | where: "song", true | where: "section", "towarzyskie" | sort: "order" %}
<ul class="song-list">
{% for song in towarzyskie %}  <li><a href="{{ song.url | relative_url }}">{{ song.title }}</a></li>
{% endfor %}</ul>

## Z archiwum

{% assign scan1 = '/assets/images/spiewnik/piesn-welecka.jpg' | relative_url %}
{% include figure.html image=scan1 caption="„Pieśń welecka” — karta z dawnego śpiewnika" %}

<p class="song__copyright">Nagrania, nuty i teksty: © Korporacja Akademicka Welecja. Wszelkie prawa zastrzeżone.</p>

<style>
  .song-list { list-style: none; padding-left: 0; }
  .song-list li { margin: .3rem 0; }
  .song__copyright { margin-top: 2.8rem; font-size: .8em; color: #888; }
</style>
