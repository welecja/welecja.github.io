---
title: Album Veletorum
excerpt: "Biogramy wybitnych Weletów — mężów stanu, architektów, naukowców i wynalazców."
aside: false
---

Przez sto kilkadziesiąt lat działalności przez Welecję przewinęło się bez mała tysiąc członków. Poniżej można zapoznać się z biogramami tych, którzy odznaczyli się w sposób wyróżniający na różnych polach działalności społecznej bądź odcisnęli znaczące piętno na historii i tożsamości stowarzyszenia. Lista ta jest sukcesywnie uzupełniana.

{% assign weleci = site.weleci | sort: "sort_name" %}
<ul>
{% for welet in weleci %}
  <li><a href="{{ welet.url | relative_url }}">{{ welet.title }}</a>{% if welet.years %} ({{ welet.years }}){% endif %}</li>
{% endfor %}
</ul>
