/* =========================================================
   TASCI Services — simulateur de devis (page d'accueil)
   Tarifs : grille tarifaire indicative HT de TASCI Services.
   Affichage : TTC pour les particuliers, HT pour les pros,
   sans TVA si CONFIG.franchiseTVA (voir js/main.js).
   ========================================================= */
(function () {
  "use strict";

  var CONFIG = window.TASCI_CONFIG || {};
  var Price = window.TasciPrice, Form = window.TasciForm;
  var root = document.getElementById("sim");
  if (!root || !Price || !Form) return;
  var form = root.querySelector("form");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Grille tarifaire (€ HT) ---------- */
  var PRICES = {
    chantierStandard: [6, 8],      // €/m²
    chantierRenforce: [8, 10],     // €/m²
    hotelChambre: [18, 30],        // €/chambre
    hotelRenfort: [28, 35],        // €/heure
    partiesCommunes: [25, 35],     // €/heure
    canape: 60,                    // à partir de, €/pièce
    matelas: 35                    // à partir de, €/pièce
  };

  var NAMES = {
    "fin-de-chantier": "Fin de chantier",
    "hotelier": "Nettoyage hôtelier",
    "parties-communes": "Parties communes",
    "mobilier-vitrerie": "Mobilier & vitrerie",
    "ascenseurs": "Nettoyage d’ascenseurs"
  };
  // Ordre des cartes : les prestations les plus utiles aux particuliers d'abord
  var ORDER = {
    particulier: ["mobilier-vitrerie", "fin-de-chantier", "hotelier", "parties-communes", "ascenseurs"],
    pro: ["fin-de-chantier", "hotelier", "parties-communes", "mobilier-vitrerie", "ascenseurs"]
  };

  var state = { step: 1, service: null, result: null };

  /* ---------- Utilitaires ---------- */
  function $(sel, ctx) { return (ctx || root).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }
  function val(name) {
    var el = form.elements[name];
    if (!el) return null;
    if (el instanceof RadioNodeList || (el.length && !el.tagName)) {
      var list = Array.prototype.slice.call(el);
      if (list[0] && list[0].type === "checkbox") return list.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
      var c = list.filter(function (i) { return i.checked; })[0];
      return c ? c.value : null;
    }
    if (el.type === "checkbox") return el.checked;
    return el.value;
  }
  function setVal(name, v) {
    var el = form.elements[name];
    if (!el) return;
    if (el instanceof RadioNodeList || (el.length && !el.tagName)) {
      Array.prototype.forEach.call(el, function (i) { i.checked = i.value === v; });
    } else if (el.type === "checkbox") el.checked = !!v;
    else el.value = v;
  }
  function num(name) {
    var v = parseFloat(String(val(name) || "").replace(",", "."));
    return isFinite(v) ? v : NaN;
  }
  function nb(n) { return String(Math.round(n * 100) / 100).replace(".", ","); }
  var eur = Price.eur;
  function rate(vals, o) { return Price.text(vals, o); } // tarif unitaire au bon régime de TVA

  /* ---------- Calcul par service ----------
     Montants déjà convertis (× TVA pour un particulier).
     { error } ou { kind: "range"|"from"|"quote", min, max, unit, lines:[[libellé, valeur]], details:[texte] } */
  var compute = {
    "fin-de-chantier": function (k) {
      var s = num("ch_surface");
      if (!(s > 0)) return { error: "Indiquez la surface à nettoyer, en m²." };
      var niveau = val("ch_niveau"), r, extras = [];
      if (val("ch_vitrages")) extras.push(["Vitrages accessibles", "supplément sur devis", "Vitrages accessibles : oui (supplément sur devis)"]);
      if (val("ch_reprise")) extras.push(["Reprise après passage des artisans", "sur devis", "Reprise après passage des artisans : oui (sur devis)"]);
      if (niveau === "findebail") {
        r = { kind: "quote", unit: "Fin de bail / déménagement — " + nb(s) + " m², selon l’état du logement",
          lines: [["Fin de bail / déménagement, " + nb(s) + " m²", "sur devis"]],
          details: ["Surface : " + nb(s) + " m²", "Prestation : fin de bail / déménagement (sur devis)"] };
      } else {
        var renf = niveau === "renforce", p = renf ? PRICES.chantierRenforce : PRICES.chantierStandard;
        r = { kind: "range", min: s * p[0] * k, max: s * p[1] * k, unit: "Pour l’intervention", lines: [], details: [] };
        r.lines.push([nb(s) + " m² × " + rate(p, { u: "/m²" }), eur(r.min) + " – " + eur(r.max)]);
        r.details.push("Surface : " + nb(s) + " m²");
        r.details.push("Niveau : " + (renf ? "Renforcé / très poussiéreux" : "Standard") + " (" + rate(p, { u: "/m²" }) + ")");
        if (extras.length) r.unit = "Pour l’intervention, hors options sur devis";
      }
      extras.forEach(function (x) { r.lines.push([x[0], x[1]]); r.details.push(x[2]); });
      return r;
    },

    "hotelier": function (k) {
      var type = val("ho_type");
      if (type === "grand") {
        return { kind: "quote", unit: "Grand nettoyage / remise en état", lines: [["Grand nettoyage / remise en état", "sur devis"]], details: ["Prestation : grand nettoyage / remise en état (sur devis)"] };
      }
      if (type === "renfort") {
        var h = num("ho_hours");
        if (!(h > 0)) return { error: "Indiquez le nombre d’heures de renfort." };
        var p = PRICES.hotelRenfort;
        return {
          kind: "range", min: h * p[0] * k, max: h * p[1] * k, unit: "Pour " + nb(h) + " h de renfort",
          lines: [[nb(h) + " h × " + rate(p, { u: "/h" }), eur(h * p[0] * k) + " – " + eur(h * p[1] * k)]],
          details: ["Prestation : renfort ponctuel de personnel", "Nombre d’heures : " + nb(h) + " h (" + rate(p, { u: "/h" }) + ")"]
        };
      }
      var n = num("ho_rooms");
      if (!(n >= 1)) return { error: "Indiquez le nombre de chambres ou de logements." };
      n = Math.round(n);
      var sel = form.elements.ho_freq;
      var freq = parseFloat(sel.value) || 1;
      var freqLabel = sel.options[sel.selectedIndex].getAttribute("data-label");
      var pc = PRICES.hotelChambre;
      var once = [n * pc[0] * k, n * pc[1] * k];
      var r = {
        kind: "range", min: once[0] * freq, max: once[1] * freq,
        unit: freq === 1 ? "Pour l’intervention" : "Par mois, " + freqLabel.replace(/^.*\(|\)$/g, ""),
        lines: [[n + " chambre" + (n > 1 ? "s" : "") + " × " + rate(pc), eur(once[0]) + " – " + eur(once[1]) + " / passage"]],
        details: ["Prestation : entretien des chambres / logements", "Nombre de chambres ou logements : " + n + " (" + rate(pc, { after: " par chambre" }) + ")", "Fréquence : " + freqLabel]
      };
      if (freq > 1) r.lines.push(["× " + freq + " passages par mois", eur(r.min) + " – " + eur(r.max)]);
      return r;
    },

    "parties-communes": function (k) {
      var type = val("pc_type");
      if (type === "forfait") return { kind: "quote", unit: "Forfait mensuel d’immeuble — visite préalable recommandée", lines: [["Forfait mensuel d’immeuble", "sur devis"]], details: ["Prestation : forfait mensuel d’immeuble (sur devis, visite préalable recommandée)"] };
      if (type === "remise") return { kind: "quote", unit: "Remise en état ponctuelle", lines: [["Remise en état ponctuelle", "sur devis"]], details: ["Prestation : remise en état ponctuelle (sur devis)"] };
      var h = num("pc_hours"), v = num("pc_visits");
      if (!(h > 0)) return { error: "Indiquez le nombre d’heures par passage." };
      if (!(v >= 1)) return { error: "Indiquez le nombre de passages par mois." };
      v = Math.round(v);
      var p = PRICES.partiesCommunes, hours = h * v;
      return {
        kind: "range", min: hours * p[0] * k, max: hours * p[1] * k, unit: "Par mois (" + nb(hours) + " h au total)",
        lines: [[nb(h) + " h × " + v + " passage" + (v > 1 ? "s" : "") + " = " + nb(hours) + " h", rate(p, { u: "/h" })]],
        details: ["Prestation : entretien régulier halls / escaliers", "Heures par passage : " + nb(h) + " h", "Passages par mois : " + v, "Taux : " + rate(p, { u: "/h" })]
      };
    },

    "mobilier-vitrerie": function (k) {
      var c = Math.max(0, Math.round(num("mo_sofas") || 0));
      var m = Math.max(0, Math.round(num("mo_mattress") || 0));
      var cu = Math.max(0, Math.round(num("mo_curtains") || 0));
      var w = !!val("mo_windows");
      if (!c && !m && !cu && !w) return { error: "Indiquez au moins un élément à nettoyer." };
      var r = { kind: c || m ? "from" : "quote", min: (c * PRICES.canape + m * PRICES.matelas) * k, unit: "", lines: [], details: [] };
      if (c) { r.lines.push([c + " canapé(s) / fauteuil(s) × " + rate(PRICES.canape, { pre: "dès " }), "dès " + eur(c * PRICES.canape * k)]); r.details.push("Canapés / fauteuils : " + c + " (à partir de " + rate(PRICES.canape) + " l’unité)"); }
      if (m) { r.lines.push([m + " matelas / mobilier textile × " + rate(PRICES.matelas, { pre: "dès " }), "dès " + eur(m * PRICES.matelas * k)]); r.details.push("Matelas / mobilier textile : " + m + " (à partir de " + rate(PRICES.matelas) + " l’unité)"); }
      if (cu) { r.lines.push([cu + " rideau(x) / voilage(s)", "sur devis"]); r.details.push("Rideaux / voilages : " + cu + " (sur devis)"); }
      if (w) { r.lines.push(["Vitres accessibles", "sur devis"]); r.details.push("Vitres accessibles : oui (sur devis)"); }
      var extra = cu || w;
      r.unit = r.kind === "quote" ? (cu ? "Selon dimensions, textile, surface et accès" : "Vitres — selon surface, accès et fréquence")
        : (extra ? "Selon textile et état — " + (cu && w ? "rideaux et vitres" : cu ? "rideaux" : "vitres") + " en plus, sur devis" : "Selon nombre de places, textile et état");
      return r;
    },

    "ascenseurs": function () {
      var n = Math.round(num("as_count"));
      if (!(n >= 1)) return { error: "Indiquez le nombre d’appareils." };
      var scope = val("as_scope") || [];
      if (!scope.length) return { error: "Cochez au moins un élément du périmètre." };
      var risky = scope.filter(function (s) { return /fosse|Toit|Machinerie/i.test(s); });
      var r = {
        kind: "quote", unit: n + " appareil" + (n > 1 ? "s" : "") + " — selon état, fréquence et périmètre",
        lines: scope.map(function (s) { return [s, "sur devis"]; }),
        details: ["Nombre d’appareils : " + n, "Périmètre : " + scope.join(", ")]
      };
      if (risky.length) r.details.push("Note sécurité : " + risky.join(", ") + " — uniquement après autorisation préalable, consignation et validation de la procédure de sécurité du site.");
      return r;
    }
  };

  /* ---------- Scène animée du hero (js/stage.js) ---------- */
  var STAGE_FIELDS = ["ch_surface", "ch_niveau", "ch_vitrages", "ch_reprise", "ho_type", "ho_rooms", "ho_freq", "ho_hours",
    "pc_type", "pc_hours", "pc_visits", "mo_sofas", "mo_mattress", "mo_curtains", "mo_windows", "as_count", "as_scope"];
  function pushStage() {
    if (!window.TasciStage) return;
    var values = {};
    STAGE_FIELDS.forEach(function (k) { values[k] = val(k); });
    window.TasciStage.update({ service: state.step === 1 ? null : state.service, step: state.step, done: state.step === 3, values: values });
  }

  /* ---------- Étapes ---------- */
  function showStep(n, focus) {
    var from = state.step;
    state.step = n;
    try { document.dispatchEvent(new CustomEvent("tasci:step", { detail: { from: from, to: n } })); } catch (e) {}
    root.setAttribute("data-step", n);
    $$(".sim__step").forEach(function (s) {
      var on = s.getAttribute("data-step") === String(n);
      s.hidden = !on;
      if (on) { s.classList.remove("is-entering"); void s.offsetWidth; s.classList.add("is-entering"); }
    });
    $$("[data-progress]").forEach(function (li) {
      var k = parseInt(li.getAttribute("data-progress"), 10);
      li.classList.toggle("is-current", k === n);
      li.classList.toggle("is-done", k < n);
      if (k === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      var b = li.querySelector("button[data-goto]");
      if (b) b.disabled = !(k < n || (k === 2 && n === 1 && state.service && state.result));
    });
    if (focus) {
      var t = $('.sim__step[data-step="' + n + '"] .sim__legend');
      if (t) t.focus({ preventScroll: true });
    }
    pushStage();
  }

  function selectService(id) {
    if (!NAMES[id]) return;
    state.service = id;
    $$(".sim-card").forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-service") === id ? "true" : "false"); });
    $$(".sim-panel").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
    $("[data-step2-title]").textContent = NAMES[id] + " : précisez votre besoin";
    hideError();
    syncSubs();
  }

  function syncSubs() {
    $$(".sub[data-sub]").forEach(function (sub) {
      var parts = sub.getAttribute("data-sub").split("=");
      sub.hidden = val(parts[0]) !== parts[1];
    });
    var safety = $("[data-safety]");
    if (safety) {
      var risky = (val("as_scope") || []).some(function (s) { return /fosse|Toit|Machinerie/i.test(s); });
      if (risky && !safety.classList.contains("is-hot")) { safety.classList.remove("is-flash"); void safety.offsetWidth; safety.classList.add("is-flash"); }
      safety.classList.toggle("is-hot", risky);
    }
  }

  function orderCards() {
    var wrap = $(".sim-cards");
    (ORDER[Price.mode()] || ORDER.pro).forEach(function (id) {
      var c = wrap.querySelector('.sim-card[data-service="' + id + '"]');
      if (c) wrap.appendChild(c);
    });
  }

  function showError(msg) { var e = $("[data-sim-error]"); e.textContent = msg; e.hidden = false; }
  function hideError() { var e = $("[data-sim-error]"); e.hidden = true; e.textContent = ""; }

  /* ---------- Résultat ---------- */
  var anim = 0;
  function animateNumbers(el, min, max, kind) {
    var dur = reduceMotion ? 0 : 900, t0 = performance.now(), id = ++anim, lab = Price.label();
    function frame(t) {
      if (id !== anim) return;
      var k = dur ? Math.min(1, (t - t0) / dur) : 1;
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = kind === "from" ? "À partir de " + eur(min * e) + lab : eur(min * e) + " – " + eur(max * e) + lab;
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function computeResult() {
    var r = compute[state.service](Price.factor());
    if (!r.error) state.result = r;
    return r;
  }

  function renderResult(r, animate) {
    $("[data-r-service]").textContent = NAMES[state.service];
    var price = $("[data-r-price]");
    anim++;
    if (r.kind === "quote") price.textContent = "Sur devis";
    else if (animate) animateNumbers(price, r.min, r.max, r.kind);
    else price.textContent = r.kind === "from" ? "À partir de " + eur(r.min) + Price.label() : eur(r.min) + " – " + eur(r.max) + Price.label();
    $("[data-r-unit]").textContent = r.unit || "";
    var ul = $("[data-r-lines]");
    ul.innerHTML = "";
    (r.lines || []).forEach(function (l) {
      var li = document.createElement("li");
      var a = document.createElement("span"); a.textContent = l[0];
      var b = document.createElement("span"); b.textContent = l[1];
      li.appendChild(a); li.appendChild(b); ul.appendChild(li);
    });
    ul.hidden = !(r.lines && r.lines.length);
  }

  function estimateText(r) {
    var lab = Price.label();
    if (r.kind === "quote") return "Sur devis";
    if (r.kind === "from") return "À partir de " + eur(r.min).replace(/ /g, " ") + lab;
    return eur(r.min).replace(/ /g, " ") + " – " + eur(r.max).replace(/ /g, " ") + lab;
  }

  /* ---------- Récapitulatif (e-mail, WhatsApp, Web3Forms) ---------- */
  function contact() {
    return { name: val("name").trim(), phone: val("phone").trim(), email: val("email").trim(), city: val("city").trim(), message: val("message").trim() };
  }
  function summary() {
    var r = state.result, c = contact(), client = Price.mode() === "pro" ? "Professionnel" : "Particulier";
    var subject = "Demande de devis – " + NAMES[state.service] + " – " + client + (c.city ? " – " + c.city : "");
    var text = [
      "Bonjour,",
      "",
      "Je souhaite recevoir un devis pour la prestation suivante.",
      "",
      "VOUS ÊTES : " + client,
      "PRESTATION : " + NAMES[state.service]
    ].concat(r.details.map(function (d) { return "- " + d; })).concat([
      "",
      "ESTIMATION DU SIMULATEUR : " + estimateText(r) + (r.unit && r.kind !== "quote" ? " (" + r.unit.charAt(0).toLowerCase() + r.unit.slice(1) + ")" : ""),
      "Base de prix : " + Price.tax("basis"),
      "Estimation indicative — prix définitif sur devis selon le cahier des charges.",
      "",
      "MES COORDONNÉES",
      "Nom : " + (c.name || "—"),
      "Téléphone : " + (c.phone || "—"),
      "E-mail : " + (c.email || "—"),
      "Ville d’intervention : " + (c.city || "—"),
      "",
      "MESSAGE",
      c.message || "—",
      "",
      "Envoyé depuis le simulateur du site " + (CONFIG.company || "TASCI Services") + "."
    ]).join("\r\n");
    return { subject: subject, text: text, client: client };
  }

  function validateContact() {
    var err = $("[data-send-error]");
    var nameEl = form.elements.name, phoneEl = form.elements.phone, emailEl = form.elements.email;
    [nameEl, phoneEl, emailEl].forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var problems = [];
    if (!nameEl.value.trim()) { problems.push("votre nom"); nameEl.setAttribute("aria-invalid", "true"); }
    var phoneOk = phoneEl.value.replace(/\D/g, "").length >= 9;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
    if (!phoneOk && !emailOk) {
      problems.push("un téléphone ou un e-mail valide");
      phoneEl.setAttribute("aria-invalid", "true"); emailEl.setAttribute("aria-invalid", "true");
    }
    if (problems.length) {
      err.textContent = "Pour être recontacté, indiquez " + problems.join(" et ") + ".";
      err.hidden = false;
      (nameEl.getAttribute("aria-invalid") ? nameEl : phoneEl).focus();
      return false;
    }
    err.hidden = true;
    return true;
  }

  /* ---------- Événements ---------- */
  $$(".sim-card").forEach(function (card) {
    card.addEventListener("click", function () {
      selectService(card.getAttribute("data-service"));
      showStep(2, true);
    });
  });
  form.addEventListener("change", function () { syncSubs(); pushStage(); });
  form.addEventListener("input", pushStage);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && state.step === 2) { e.preventDefault(); $("[data-sim-compute]").click(); }
  });
  $$("[data-goto]").forEach(function (b) {
    b.addEventListener("click", function () { if (!b.disabled) showStep(parseInt(b.getAttribute("data-goto"), 10), true); });
  });
  $$("[data-sim-back]").forEach(function (b) {
    b.addEventListener("click", function () { showStep(parseInt(b.getAttribute("data-sim-back"), 10), true); });
  });
  $("[data-sim-compute]").addEventListener("click", function () {
    var r = computeResult();
    if (r.error) { showError(r.error); return; }
    hideError();
    showStep(3, true);
    renderResult(r, true);
  });
  $("[data-sim-send]").addEventListener("click", function () {
    if (!state.result || !validateContact()) return;
    var sm = summary(), c = contact();
    Form.send({
      subject: sm.subject, text: sm.text,
      data: { name: c.name, email: c.email, phone: c.phone, city: c.city, client: sm.client, service: NAMES[state.service], estimate: estimateText(state.result) },
      button: $("[data-sim-send]"), status: $("[data-send-status]"), honeypot: form.elements.botcheck
    });
  });
  $("[data-sim-wa]").addEventListener("click", function () {
    if (!state.result) return;
    Form.openWhatsApp(summary().text);
  });

  // Changement Particulier / Professionnel : ordre des cartes + estimation recalculée
  document.addEventListener("tasci:client", function () {
    orderCards();
    if (state.step === 3 && state.service) {
      var r = computeResult();
      if (!r.error) renderResult(r, false);
    }
  });

  /* ---------- Préselection (carrousel, section particuliers, autres pages) ---------- */
  var PRESETS = {
    findebail: function () { setVal("ch_niveau", "findebail"); },
    airbnb: function () { setVal("ho_type", "chambres"); setVal("ho_rooms", "1"); },
    textile: function () { setVal("mo_sofas", "1"); setVal("mo_windows", false); },
    vitres: function () { setVal("mo_sofas", "0"); setVal("mo_mattress", "0"); setVal("mo_curtains", "0"); setVal("mo_windows", true); }
  };
  function preselect(id, scroll, opts) {
    if (!NAMES[id]) return;
    opts = opts || {};
    if (opts.client) Price.set(opts.client);
    if (opts.preset && PRESETS[opts.preset]) PRESETS[opts.preset]();
    selectService(id);
    showStep(2, false);
    if (scroll) {
      var top = root.getBoundingClientRect().top + window.scrollY - (document.querySelector(".site-header") || { offsetHeight: 72 }).offsetHeight - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
    }
    setTimeout(function () { var t = $('.sim__step[data-step="2"] .sim__legend'); if (t) t.focus({ preventScroll: true }); }, scroll ? 500 : 0);
  }
  window.TasciSim = { preselect: preselect };

  document.querySelectorAll("[data-simulate]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      preselect(btn.getAttribute("data-simulate"), true, { client: btn.getAttribute("data-client"), preset: btn.getAttribute("data-preset") });
    });
  });

  // services.html → index.html?service=hotelier&client=pro#simulateur
  try {
    var qs = new URLSearchParams(location.search);
    var q = qs.get("service");
    if (q && NAMES[q]) preselect(q, false, { client: qs.get("client"), preset: qs.get("preset") });
  } catch (e) {}

  orderCards();
  showStep(state.step, false);
})();
