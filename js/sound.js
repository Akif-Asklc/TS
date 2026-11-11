/* =========================================================
   TASCI Services — sons discrets (Web Audio API, aucun fichier)
   - Désactivé par défaut : le visiteur l'active avec le bouton
     haut-parleur ([data-sound-toggle]) ; le choix est mémorisé.
   - Trois sons seulement : choix d'une prestation, changement
     d'étape, estimation prête.
   - Rien n'est créé avant un geste de l'utilisateur.
   API : window.TasciSound.play(nom), .enabled(), .setEnabled(bool)
   ========================================================= */
(function () {
  "use strict";

  var AC = window.AudioContext || window.webkitAudioContext;
  var KEY = "tasci-sound";
  var MASTER = 0.25;
  var ctx = null, master = null;
  var on = false; // opt-in
  try { on = localStorage.getItem(KEY) === "on"; } catch (e) {}

  /* ---------- Contexte audio ---------- */
  function ensure() {
    if (!AC) return null;
    try {
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = MASTER;
        master.connect(ctx.destination);
        // iOS : jouer un tampon silencieux pendant le geste débloque la sortie audio
        var b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource();
        src.buffer = b; src.connect(ctx.destination); src.start(0);
      }
      // "suspended" (politique d'autoplay) ou "interrupted" (iOS : appel, autre appli audio)
      if (ctx.state !== "running") ctx.resume();
    } catch (e) { ctx = null; }
    return ctx;
  }
  function unlock() { if (on) ensure(); }
  // Écouteurs non passifs sur click / touchend : seuls gestes acceptés par iOS Safari
  ["click", "touchend", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, unlock, { capture: true, passive: false });
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && ctx && on && ctx.state !== "running") { try { ctx.resume(); } catch (e) {} }
  });

  /* ---------- Synthèse : sinus / triangle doux uniquement ---------- */
  function tone(f, dur, vol, at, type) {
    var t = ctx.currentTime + (at || 0);
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  var SOUNDS = {
    // choix d'une prestation : deux notes douces
    select: function () { tone(587, 0.22, 0.12); tone(880, 0.3, 0.09, 0.07); },
    // changement d'étape : une note très courte et feutrée
    step: function () { tone(660, 0.16, 0.07, 0, "triangle"); },
    // estimation prête : petit carillon
    done: function () { [523, 659, 784].forEach(function (f, i) { tone(f, 0.6, 0.09, i * 0.09); }); },
    // confirmation à l'activation du son
    toggle: function () { tone(740, 0.18, 0.08); }
  };

  function play(name) {
    if (!on || document.hidden || !SOUNDS[name]) return;
    var c = ensure();
    if (!c) return;
    var go = function () { try { SOUNDS[name](); } catch (e) {} };
    if (c.state === "running") go();
    else { try { c.resume().then(go, function () {}); } catch (e) {} }
  }

  /* ---------- Bouton on/off ---------- */
  function syncToggles() {
    document.querySelectorAll("[data-sound-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", on ? "Couper le son" : "Activer le son");
      b.title = on ? "Son activé" : "Son coupé";
    });
  }
  function setOn(v) {
    on = !!v;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {}
    syncToggles();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-sound-toggle]");
    if (!b) return;
    setOn(!on);
    if (on) play("toggle");
  });
  syncToggles();

  /* ---------- Simulateur ---------- */
  var sim = document.getElementById("sim");
  if (sim) {
    sim.addEventListener("click", function (e) { if (e.target.closest(".sim-card")) play("select"); });
  }
  document.addEventListener("tasci:step", function (e) {
    var d = e.detail || {};
    if (d.to === 3 && d.from !== 3) play("done");
    else if (d.to !== d.from && !(d.from === 1 && d.to === 2)) play("step"); // 1 → 2 : déjà le son de sélection
  });

  window.TasciSound = { play: play, enabled: function () { return on; }, setEnabled: setOn };
})();
