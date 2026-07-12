---
title: Portal Welecki
permalink: /dla-weletow/
redirect_from:
  - /spiewnik/
indexing: false
excerpt: "Portal Welecki — dostęp dla Weletów."
---

Ta część serwisu przeznaczona jest dla Weletów. Aby przejść dalej, podaj hasło.

<form class="gate" onsubmit="return sprawdzHaslo(event)">
  <input class="gate__input" id="gate-haslo" type="password" placeholder="Hasło" autocomplete="off" autofocus>
  <button class="button" type="submit">Wejdź</button>
  <p class="gate__error" id="gate-error" hidden>Nieprawidłowe hasło.</p>
</form>

<style>
  .gate { margin: 1.6rem 0; max-width: 24rem; }
  .gate__input {
    display: block; width: 100%; padding: .55rem .8rem; margin-bottom: .8rem;
    font: inherit; border: 1px solid #ccc; border-radius: 2px;
  }
  .gate__input:focus { outline: none; border-color: #005248; }
  .gate__error { color: #a33; margin-top: .8rem; }
</style>
<script>
  async function sprawdzHaslo(e) {
    e.preventDefault();
    var pw = document.getElementById('gate-haslo').value.trim();
    var err = document.getElementById('gate-error');
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    var hex = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    if (hex === 'f804663d999ea924c7537b90bfa97955add47fb390ccda98c0ea1647c48b782c') {
      window.location.href = '{{ site.baseurl }}' + atob('L2JhcmR6by10YWpueS1wb3J0YWwtd2VsZWNraS1oYXNsbw==') + pw + '/';
    } else {
      err.hidden = false;
    }
    return false;
  }
</script>
