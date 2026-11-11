/* =========================================================
   TASCI Services — carrousel des services
   Glisser (tactile + souris), flèches, points, clavier,
   lecture auto mise en pause au survol / focus.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var viewport = root.querySelector(".carousel__viewport");
    var track = root.querySelector(".carousel__track");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".carousel__dot"));
    var arrows = root.querySelectorAll(".carousel__arrow");
    var count = slides.length;
    var index = 0;
    var autoplayMs = 7000;
    var timer = null, illuTimer = null;
    var hovering = false, focusWithin = false, inView = true;

    /* --- Illustrations : lecture uniquement sur la diapositive active --- */
    function playIllu(slide) {
      clearInterval(illuTimer);
      slides.forEach(function (s) { var svg = s.querySelector(".illu"); if (svg) svg.classList.remove("play"); });
      var svg = slide.querySelector(".illu");
      if (!svg) return;
      void svg.getBoundingClientRect(); // relance l'animation
      svg.classList.add("play");
      if (reduceMotion) return;
      var cycle = parseInt(svg.getAttribute("data-cycle"), 10) || 5000;
      illuTimer = setInterval(function () {
        if (!inView) return;
        svg.classList.remove("play");
        void svg.getBoundingClientRect();
        svg.classList.add("play");
        }, cycle);
    }

    function update(focusDot) {
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      slides.forEach(function (s, i) {
        var active = i === index;
        s.setAttribute("aria-hidden", active ? "false" : "true");
        if ("inert" in s) s.inert = !active;
        else s.querySelectorAll("a, button").forEach(function (el) { el.tabIndex = active ? 0 : -1; });
      });
      dots.forEach(function (d, i) {
        var active = i === index;
        d.setAttribute("aria-selected", active ? "true" : "false");
        d.tabIndex = active ? 0 : -1;
      });
      if (focusDot) dots[index].focus();
      playIllu(slides[index]);
    }

    function go(i, focusDot) {
      index = (i + count) % count;
      update(focusDot);
      schedule();
    }

    /* --- Lecture automatique (en pause au survol / focus / hors écran) --- */
    function schedule() {
      clearTimeout(timer); timer = null;
      root.classList.remove("is-autoplay");
      void root.offsetWidth; // relance la barre de progression du point actif
      if (reduceMotion || !inView) return;
      var paused = hovering || focusWithin;
      root.classList.add("is-autoplay");
      root.classList.toggle("is-paused", paused);
      if (!paused) timer = setTimeout(function () { go(index + 1); }, autoplayMs);
    }

    root.addEventListener("mouseenter", function () { hovering = true; schedule(); });
    root.addEventListener("mouseleave", function () { hovering = false; schedule(); });
    root.addEventListener("focusin", function () { if (!focusWithin) { focusWithin = true; schedule(); } });
    root.addEventListener("focusout", function (e) {
      if (!root.contains(e.relatedTarget)) { focusWithin = false; schedule(); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) { playIllu(slides[index]); } else { clearInterval(illuTimer); }
        schedule();
      }, { threshold: 0.25 }).observe(root);
    }

    /* --- Contrôles --- */
    arrows.forEach(function (btn) {
      btn.addEventListener("click", function () { go(index + parseInt(btn.getAttribute("data-dir"), 10)); });
    });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
    function onKey(e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1, e.currentTarget !== viewport); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1, e.currentTarget !== viewport); }
      else if (e.key === "Home") { e.preventDefault(); go(0, e.currentTarget !== viewport); }
      else if (e.key === "End") { e.preventDefault(); go(count - 1, e.currentTarget !== viewport); }
    }
    viewport.addEventListener("keydown", function (e) { if (e.target === viewport) onKey(e); });
    root.querySelector(".carousel__dots").addEventListener("keydown", onKey);

    /* --- Glisser (pointer events : souris + tactile + stylet) --- */
    var startX = 0, startY = 0, dx = 0, dragging = false, decided = false, horizontal = false, pid = null;
    viewport.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("a, button, input, select, textarea")) return;
      startX = e.clientX; startY = e.clientY; dx = 0;
      dragging = true; decided = false; horizontal = false; pid = e.pointerId;
    });
    viewport.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pid) return;
      var mx = e.clientX - startX, my = e.clientY - startY;
      if (!decided) {
        if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
        decided = true; horizontal = Math.abs(mx) > Math.abs(my);
        if (!horizontal) { dragging = false; return; }
        try { viewport.setPointerCapture(pid); } catch (err) {}
        viewport.classList.add("is-dragging");
        track.classList.add("no-anim");
      }
      dx = mx;
      var w = viewport.clientWidth;
      var resist = ((index === 0 && dx > 0) || (index === count - 1 && dx < 0)) ? 0.35 : 1;
      track.style.transform = "translateX(calc(" + (-index * 100) + "% + " + (dx * resist) + "px))";
      if (w) e.preventDefault();
    });
    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
      track.classList.remove("no-anim");
      if (!horizontal) return;
      var threshold = Math.min(120, viewport.clientWidth * 0.18);
      if (dx < -threshold && index < count - 1) go(index + 1);
      else if (dx > threshold && index > 0) go(index - 1);
      else update();
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("lostpointercapture", endDrag);
    // Empêche un clic accidentel après un glisser
    viewport.addEventListener("click", function (e) { if (Math.abs(dx) > 8) { e.preventDefault(); e.stopPropagation(); dx = 0; } }, true);
    viewport.addEventListener("dragstart", function (e) { e.preventDefault(); });

    update();
    schedule();
  });
})();
