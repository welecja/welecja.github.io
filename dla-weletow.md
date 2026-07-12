---
title: Dla Weletów
permalink: /dla-weletow/
redirect_from:
  - /spiewnik/
excerpt: "Materiały dla Weletów — Portal Welecki i Śpiewnik."
---

## Portal Welecki

Dokumenty wewnętrzne Korporacji — komunikaty, protokoły i sprawy bieżące. Dostęp mają Weleci należący do Grupy Google.

{% include button.html text="Wejdź do Portalu" link="https://docs.google.com/document/d/1tqRIx9gVz6ja8K8I1Pk4qXGdX-p_WpNBv2AeSTmsMy4/edit?usp=sharing" %}

## Śpiewnik

Nagrania, nuty i teksty pieśni weleckich — od pieśni oficjalnych po komersowe. Dostęp na hasło.

<form class="gate" onsubmit="return sprawdzHaslo(event)">
  <input class="gate__input" id="gate-haslo" type="password" placeholder="Hasło" autocomplete="off">
  <button class="button" type="submit">Wejdź do Śpiewnika</button>
  <p class="gate__error" id="gate-error" hidden>Nieprawidłowe hasło.</p>
</form>

<style>
  .gate { margin: 1.2rem 0; display: flex; flex-wrap: wrap; align-items: center; gap: .8rem; max-width: 30rem; }
  .gate__input {
    flex: 1 1 10rem; padding: .55rem .8rem;
    font: inherit; border: 1px solid #ccc; border-radius: 2px;
  }
  .gate__input:focus { outline: none; border-color: #005248; }
  .gate__error { color: #a33; flex-basis: 100%; margin: 0; }
</style>
<script>
  async function sprawdzHaslo(e) {
    e.preventDefault();
    var pw = document.getElementById('gate-haslo').value.trim();
    var err = document.getElementById('gate-error');
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    var hex = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    if (hex === 'f804663d999ea924c7537b90bfa97955add47fb390ccda98c0ea1647c48b782c') {
      window.location.href = '{{ site.baseurl }}' + atob('L2JhcmR6by10YWpueS1saW5rLWRvLXNwaWV3bmlrYS1oYXNsbw==') + pw + '/';
    } else {
      err.hidden = false;
    }
    return false;
  }
</script>
