---
title: Kronika
excerpt: "Wszystkie aktualności Welecji według roczników — od 2006 r. do dziś."
aside: false
---

Pełny spis aktualności Welecji według roczników. Wpisy z lat 2006–2020 zostały przeniesione z archiwum starej strony welecja.pl.

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in posts_by_year %}
## {{ year.name }}

<ul>
{% for post in year.items %}
  <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a> <small>({{ post.date | date: "%-d.%m.%Y" }})</small></li>
{% endfor %}
</ul>
{% endfor %}
