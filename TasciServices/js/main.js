/* =========================================================
   TASCI Services — script principal
   ========================================================= */

/* ---------------------------------------------------------
   CONFIGURATION — À COMPLÉTER
   >>> Remplacez l'adresse ci-dessous par l'adresse e-mail
   >>> réelle de l'entreprise. Elle est utilisée par le
   >>> simulateur de devis ET par le formulaire de contact
   >>> (liens mailto:), ainsi que pour les liens e-mail affichés.
   --------------------------------------------------------- */
var CONFIG = {
  email: "tasci.services@gmail.com", // adresse e-mail de l'entreprise (destination des demandes)
  phone: "06 43 70 09 11",
  whatsapp: "33643700911",           // numéro WhatsApp au format international, sans + ni espaces
  contactName: "Mustafa Tasci",
  company: "TASCI Services",

  /* ENVOI DES FORMULAIRES — Web3Forms (gratuit)
     1. Aller sur https://web3forms.com, saisir tasci.services@gmail.com et cliquer « Create Access Key ».
     2. Copier la clé reçue par e-mail entre les guillemets ci-dessous.
     Clé vide = les formulaires ouvrent la messagerie du visiteur (mailto) à la place. */
  web3formsKey: "20ca93b8-30c0-49a8-ba74-9b0ddea6a697", // clé Web3Forms liée à tasci.services@gmail.com (publique par conception)

  /* TVA
     tva : taux appliqué aux prix TTC affichés aux particuliers (0.20 = 20 %).
     franchiseTVA : si Mustafa est micro-entrepreneur en franchise de TVA, mettre true :
     tous les prix s'affichent alors sans TVA, avec la mention « TVA non applicable, art. 293 B du CGI »,
     et sans libellé HT / TTC. */
  tva: 0.20,
  franchiseTVA: false
};
window.TASCI_CONFIG = CONFIG;

(function () {
  "use strict";

  var html = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- E-mail affiché = CONFIG.email ---------- */
  document.querySelectorAll("[data-config-email]").forEach(function (a) {
    a.href = "mailto:" + CONFIG.email;
    a.textContent = CONFIG.email;
  });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Écran de chargement (première visite de la session) ---------- */
  var loader = document.querySelector(".loader");
  if (loader && html.classList.contains("is-first")) {
    var start = performance.now();
    var minTime = 1250, maxTime = 2400, closed = false;
    var close = function () {
      if (closed) return; closed = true;
      loader.classList.add("is-done");
      setTimeout(function () { html.classList.remove("is-first"); loader.classList.remove("is-done"); }, 460);
    };
    var whenReady = function () {
      var wait = Math.max(0, minTime - (performance.now() - start));
      setTimeout(close, wait);
    };
    if (document.readyState === "complete") whenReady();
    else window.addEventListener("load", whenReady, { once: true });
    setTimeout(close, maxTime);
  }

  /* ---------- Transition entre pages ---------- */
  var pt = document.querySelector(".pt");
  function clearTransition() {
    html.classList.remove("is-entering", "is-first");
    if (pt) pt.classList.remove("is-leaving", "is-entering");
    if (loader) loader.classList.remove("is-done");
  }
  if (pt && html.classList.contains("is-entering")) {
    requestAnimationFrame(function () {
      pt.classList.add("is-entering");
      setTimeout(clearTransition, 620);
    });
  }
  // Retour arrière (bfcache) : ne jamais laisser un voile bloqué
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) clearTransition();
    try { sessionStorage.removeItem("tasci-nav"); } catch (err) {}
  });

  function normPath(p) { return p.replace(/index\.html$/, ""); }

  document.addEventListener("click", function (e) {
    if (reduceMotion || !pt) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    // Lien vers la même page (ancre) : défilement natif
    if (normPath(url.pathname) === normPath(location.pathname) && url.search === location.search) return;

    e.preventDefault();
    try { sessionStorage.setItem("tasci-nav", "1"); } catch (err) {}
    pt.classList.remove("is-entering");
    pt.classList.add("is-leaving");
    setTimeout(function () { location.href = url.href; }, 430);
  });

  /* ---------- En-tête : ombre au défilement + menu mobile ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    if (!burger || !nav) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    nav.classList.toggle("is-open", open);
  }
  if (burger && nav) {
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { setMenu(false); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) setMenu(false); });
  }

  /* ---------- Apparitions au défilement ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.querySelectorAll(".reveal"), function (el, i) {
      el.style.setProperty("--delay", i * 90 + "ms");
    });
  });
  var revealEls = document.querySelectorAll(".reveal, .reveal-diag");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }
})();

/* =========================================================
   Prix : Particulier (TTC) / Professionnel (HT) / franchise de TVA
   Tout élément [data-p] est réécrit selon le profil choisi.
   ========================================================= */
window.TasciPrice = (function () {
  "use strict";
  var KEY = "tasci-client", mode = "particulier"; // par défaut : particulier (prix TTC, obligatoires envers les consommateurs)
  try { var m = sessionStorage.getItem(KEY); if (m === "pro" || m === "particulier") mode = m; } catch (e) {}
  function franchise() { return !!CONFIG.franchiseTVA; }
  function rate() { return Math.round((CONFIG.tva || 0) * 1000) / 10; }
  function factor() { return !franchise() && mode === "particulier" ? 1 + (CONFIG.tva || 0) : 1; }
  function label() { return franchise() ? "" : (mode === "particulier" ? " TTC" : " HT"); }
  function num(n) {
    n = Math.round(n * 100) / 100;
    var parts = (n % 1 === 0 ? String(n) : n.toFixed(2)).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(",");
  }
  function eur(n) { return num(Math.round(n)) + " €"; }
  function text(vals, o) {
    o = o || {}; var k = factor();
    if (!Array.isArray(vals)) vals = [vals];
    return (o.pre || "") + vals.map(function (v) { return num(v * k); }).join(" à ") + " €" + (o.u || "") + label() + (o.after || "");
  }
  function tax(key) {
    var r = String(rate()).replace(".", ",");
    var T = {
      col: { pro: "Tarif HT", particulier: "Tarif TTC", f: "Tarif" },
      caption: { pro: "Tarifs indicatifs hors taxes", particulier: "Tarifs indicatifs TTC (TVA " + r + " % incluse)", f: "Tarifs indicatifs — TVA non applicable, art. 293 B du CGI" },
      disclaimer: {
        pro: "Estimation indicative hors taxes — prix définitif sur devis selon le cahier des charges.",
        particulier: "Estimation indicative TTC (TVA " + r + " % incluse) — prix définitif sur devis selon le cahier des charges.",
        f: "Estimation indicative — TVA non applicable, art. 293 B du CGI. Prix définitif sur devis selon le cahier des charges."
      },
      basis: { pro: "HT (hors taxes)", particulier: "TTC (TVA " + r + " % incluse)", f: "TVA non applicable, art. 293 B du CGI" }
    };
    return T[key] ? T[key][franchise() ? "f" : mode] : "";
  }
  function render() {
    document.documentElement.setAttribute("data-client", mode);
    document.documentElement.toggleAttribute("data-franchise", franchise());
    document.querySelectorAll("[data-p]").forEach(function (el) {
      el.textContent = text(el.getAttribute("data-p").split("|").map(Number), { u: el.getAttribute("data-u"), after: el.getAttribute("data-after"), pre: el.getAttribute("data-pre") });
    });
    document.querySelectorAll("[data-tax]").forEach(function (el) { el.textContent = tax(el.getAttribute("data-tax")); });
    document.querySelectorAll("[data-client-btn]").forEach(function (b) {
      var on = b.getAttribute("data-client-btn") === mode;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
  }
  function set(m) {
    if (m !== "pro" && m !== "particulier") return;
    var changed = m !== mode;
    mode = m;
    try { sessionStorage.setItem(KEY, mode); } catch (e) {}
    render();
    if (changed) { try { document.dispatchEvent(new CustomEvent("tasci:client", { detail: { mode: mode } })); } catch (e) {} }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-client-btn]");
    if (b) set(b.getAttribute("data-client-btn"));
  });
  document.addEventListener("keydown", function (e) {
    var b = e.target.closest && e.target.closest("[data-client-btn]");
    if (!b || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
    e.preventDefault();
    var next = mode === "pro" ? "particulier" : "pro";
    set(next);
    var t = b.parentNode.querySelector('[data-client-btn="' + next + '"]'); if (t) t.focus();
  });
  render();
  return { mode: function () { return mode; }, set: set, factor: factor, label: label, text: text, num: num, eur: eur, tax: tax, franchise: franchise };
})();

/* =========================================================
   Envoi des formulaires : Web3Forms -> repli mailto ; WhatsApp en option
   ========================================================= */
window.TasciForm = (function () {
  "use strict";
  function enc(s) { return encodeURIComponent(s); }
  function attr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function mailto(subject, text) { return "mailto:" + CONFIG.email + "?subject=" + enc(subject) + "&body=" + enc(text); }
  function whatsapp(text) { return "https://wa.me/" + CONFIG.whatsapp + "?text=" + enc(text); }
  function show(el, kind, html) { el.hidden = false; el.className = "send-status send-status--" + kind; el.innerHTML = html; }
  function others(mail, text) {
    return '<a href="' + attr(mail) + '">par e-mail</a>, <a href="' + attr(whatsapp(text)) + '" target="_blank" rel="noopener">par WhatsApp</a> ou au <a href="tel:+33643700911">06 43 70 09 11</a>';
  }
  function labelFor(btn) { return btn && btn.querySelector("[data-send-label]"); }
  // Libellé du bouton principal selon la configuration
  document.querySelectorAll("[data-send-label]").forEach(function (l) {
    if (!CONFIG.web3formsKey) l.textContent = l.textContent.replace(/^Envoyer (ma demande|le message)$/, "Envoyer $1 par e-mail");
  });
  /* o : { subject, text, data, button, status, honeypot, onSuccess } */
  function send(o) {
    var mail = mailto(o.subject, o.text);
    if (o.honeypot && o.honeypot.value) { show(o.status, "ok", "<b>Demande envoyée !</b> Mustafa vous recontacte rapidement."); return; }
    if (!CONFIG.web3formsKey) {
      show(o.status, "info", "Votre messagerie s’ouvre avec la demande déjà rédigée : il ne reste qu’à l’envoyer. Si rien ne s’ouvre, contactez-nous " + others(mail, o.text) + ".");
      window.location.href = mail;
      return;
    }
    var btn = o.button, lab = labelFor(btn), old = lab ? lab.textContent : "";
    if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.classList.add("is-loading"); }
    if (lab) lab.textContent = "Envoi en cours…";
    o.status.hidden = true;
    var payload = Object.assign({
      access_key: CONFIG.web3formsKey,
      subject: o.subject,
      from_name: "Site " + (CONFIG.company || "TASCI Services"),
      botcheck: ""
    }, o.data || {}, { message: o.text });
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok || !j.success) throw new Error(j.message || r.status); });
    }).then(function () {
      show(o.status, "ok", "<b>Demande envoyée !</b> Mustafa vous recontacte rapidement.");
      if (o.onSuccess) o.onSuccess();
    }).catch(function () {
      show(o.status, "error", "<b>L’envoi n’a pas abouti.</b> Votre messagerie s’ouvre avec la demande déjà rédigée. Vous pouvez aussi nous contacter " + others(mail, o.text) + ".");
      window.location.href = mail;
    }).then(function () {
      if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.classList.remove("is-loading"); }
      if (lab) lab.textContent = old;
    });
  }
  function openWhatsApp(text) { window.open(whatsapp(text), "_blank", "noopener"); }
  return { send: send, mailto: mailto, whatsapp: whatsapp, openWhatsApp: openWhatsApp };
})();
