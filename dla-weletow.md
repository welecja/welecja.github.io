---
title: Dla Weletów
permalink: /dla-weletow/
redirect_from:
  - /spiewnik/
excerpt: "Materiały dla Weletów — Portal Welecki i Śpiewnik."
---

## Portal Welecki

Portal wewnętrzny dla członków Welecji.

{% include button.html text="Przejdź do Portalu" link="https://docs.google.com/document/d/1tqRIx9gVz6ja8K8I1Pk4qXGdX-p_WpNBv2AeSTmsMy4/edit?usp=sharing" %}

## Śpiewnik

Nagrania, nuty i teksty pieśni weleckich. Dostęp na hasło.

<form class="gate" onsubmit="return sprawdzHaslo(event)">
  <input class="gate__input" id="gate-haslo" type="password" placeholder="Hasło" autocomplete="off">
  <button class="button" type="submit">Przejdź do Śpiewnika</button>
  <p class="gate__error" id="gate-error" hidden>Nieprawidłowe hasło.</p>
</form>

<style>
  .gate { margin: 1.2rem 0; max-width: 24rem; }
  .gate__input {
    display: block; width: 100%; padding: .55rem .8rem; margin-bottom: .8rem;
    font: inherit; border: 1px solid #ccc; border-radius: 2px;
  }
  .gate__input:focus { outline: none; border-color: #005248; }
  .gate__error { color: #a33; margin-top: .8rem; }
</style>
<script>
  // brama: adres docelowy zaszyfrowany AES-GCM kluczem z hasła (PBKDF2);
  // poprawne hasło = udane odszyfrowanie, adres nie występuje w źródle strony
  var GATE_ENTRIES = [
    {"salt":"LJmQzQCvXU+DgIF1ev9fkg==","iv":"Vwz3PblmXEmstb2n","ct":"EUvpLACoQ/tQLVAFYcJjlW9F4qMTZdQPfAkgZKcwzrj+OerNTVsrbMuQMONVoroxABDqV3EiEkSG8Q=="},
    {"salt":"w/qg/yCTq/RBLrRZTYVcCA==","iv":"a6YWM2sDAT2PUYzJ","ct":"l/B2ZptMebO+V/3H4y0+/xzzdeoNCi+4nbVVwc4ZGFhgLIdYhxMgkXEJzck2jV9WiAIcdiRjiX4jAg=="}
  ];
  function b2u(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  async function odszyfruj(pw, e) {
    try {
      var enc = new TextEncoder();
      var km = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
      var key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: b2u(e.salt), iterations: 100000, hash: 'SHA-256' },
        km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b2u(e.iv) }, key, b2u(e.ct));
      return new TextDecoder().decode(pt);
    } catch (err) { return null; }
  }
  async function sprawdzHaslo(ev) {
    ev.preventDefault();
    var pw = document.getElementById('gate-haslo').value.trim().toLowerCase();
    var err = document.getElementById('gate-error');
    for (var i = 0; i < GATE_ENTRIES.length; i++) {
      var target = await odszyfruj(pw, GATE_ENTRIES[i]);
      if (target) { window.location.href = '{{ site.baseurl }}' + target; return false; }
    }
    err.hidden = false;
    return false;
  }
</script>
