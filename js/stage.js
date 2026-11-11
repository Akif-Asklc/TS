/* =========================================================
   TASCI Services — scène animée du hero
   Pilotée en direct par le simulateur :
     window.TasciStage.update({ service, step, done, values })
   Chaque scène est un SVG généré à partir des réponses ;
   les animations utilisent la Web Animations API et
   tournent en boucle sur un cycle commun (T ms).
   prefers-reduced-motion : changements d'état statiques.
   ========================================================= */
(function () {
  "use strict";

  var host = document.querySelector("[data-stage]");
  if (!host) return;
  var layers = host.querySelector(".stage__layers");
  var hud = document.querySelector(".stage__hud");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var C = {
    navy: "#0d2a63", navy2: "#14306b", blue: "#2f7fe0", blue2: "#3a8ee6",
    ice: "#eaf2fd", ice2: "#f4f8fe", line: "#d6e1f2", dust: "#9aa8bf", grey: "#c9d4e6", mute: "#a9b6ca", white: "#ffffff"
  };
  var FONT = "Archivo, 'Helvetica Neue', Arial, sans-serif";
  var uid = 0;

  /* ---------- petites aides ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(v, d) { var x = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(x) ? x : d; }
  function r1(x) { return Math.round(x * 10) / 10; }
  function fr(x) { return String(r1(x)).replace(".", ","); }
  function rng(seed) { // générateur déterministe : positions stables d'un rendu à l'autre
    return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function rect(x, y, w, h, fill, extra) { return '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" fill="' + fill + '"' + (extra || "") + "/>"; }
  function text(x, y, s, size, fill, weight, anchor, extra) {
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-family="' + FONT + '" font-size="' + size + '" font-weight="' + (weight || 700) + '" fill="' + fill + '" text-anchor="' + (anchor || "start") + '"' + (extra || "") + ">" + s + "</text>";
  }
  function g(tr, inner, extra) { return '<g transform="' + tr + '"' + (extra || "") + ">" + inner + "</g>"; }
  function icon(id, x, y, s, color) { return '<use href="#i-' + id + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + s + '" height="' + s + '" style="color:' + color + '"/>'; }
  // trajectoire de translation : [[offset, x, y], ...]
  function K(pts) {
    var first = pts[0];
    return ' data-a="k" data-k="' + pts.map(function (p) { return p[0] + ":" + r1(p[1]) + "," + r1(p[2]); }).join(";") + '" transform="translate(' + r1(first[1]) + " " + r1(first[2]) + ')"';
  }
  function A(name, p, extra) { return ' data-a="' + name + '" data-p="' + clamp(p || 0, 0, 0.95).toFixed(3) + '"' + (extra || ""); }
  function star(x, y, s, p, fill) {
    return g("translate(" + r1(x) + " " + r1(y) + ") scale(" + (s / 14).toFixed(3) + ")",
      '<path' + A("twinkle", p) + ' fill="' + (fill || C.blue) + '" d="M0-14C2-3 3-2 14 0 3 2 2 3 0 14-2 3-3 2-14 0-3-2-2-3 0-14Z"/>');
  }
  function badge(x, y, label) {
    var w = 18 + label.length * 8.2;
    return g("translate(" + r1(x - w) + " " + r1(y) + ")", "<g" + A("pop", 0.2) + ">" + rect(0, 0, w, 28, C.navy, ' rx="14"') + text(w / 2, 19, label, 14, C.white, 800, "middle") + "</g>");
  }
  function lock(x, y) {
    return g("translate(" + r1(x) + " " + r1(y) + ")", "<g" + A("pop", 0.15) + ">" +
      '<circle r="13" fill="' + C.navy + '" stroke="#fff" stroke-width="2.5"/>' +
      '<rect x="-5.5" y="-1.5" width="11" height="8.5" rx="1.5" fill="#fff"/><path d="M-3.2-1.5v-3a3.2 3.2 0 0 1 6.4 0v3" fill="none" stroke="#fff" stroke-width="2"/></g>');
  }
  function bg() { return rect(0, 0, 640, 520, C.ice); }

  /* ---------- scène d'accueil ---------- */
  function sceneIdle() {
    var items = [["broom", "Fin de chantier"], ["bed", "Hôtelier"], ["building", "Parties communes"], ["sofa", "Mobilier & vitrerie"], ["elevator", "Ascenseurs"]];
    var out = [bg(),
      '<polygon points="430,0 520,0 330,520 240,520" fill="#dce8fb"/>',
      '<polygon points="540,0 600,0 410,520 350,520" fill="' + C.blue + '"/>',
      '<polygon points="618,0 640,0 640,40 434,520 412,520" fill="' + C.blue2 + '"/>',
      '<polygon points="640,90 640,520 470,520" fill="' + C.navy + '"/>'];
    items.forEach(function (it, i) {
      var y = 84 + i * 76, p = i / 5;
      out.push(g("translate(48 " + y + ")",
        '<rect x="-14" y="-14" width="380" height="64" rx="12" fill="#fff" opacity="0"' + A("pulse", p) + "/>" +
        '<rect x="0" y="0" width="36" height="36" rx="9" fill="' + C.navy + '"/>' + icon(it[0], 6, 6, 24, "#fff") +
        text(54, 25, it[1].replace("&", "&amp;"), 24, C.navy, 800)));
      out.push(star(392, y + 6, 12, p + 0.03));
    });
    out.push(star(560, 120, 26, 0.1, "#fff"), star(500, 300, 16, 0.5, "#fff"), star(590, 420, 20, 0.75, "#fff"));
    return { T: 7500, svg: out.join(""), label: "Choisissez une prestation", caption: "La scène s’adapte à chacune de vos réponses." };
  }

  /* ---------- fin de chantier ---------- */
  function sceneChantier(v, o) {
    var s = clamp(num(v.ch_surface, 80), 1, 100000), heavy = v.ch_niveau === "renforce", vit = !!v.ch_vitrages, rep = !!v.ch_reprise;
    var bail = v.ch_niveau === "findebail";
    var clean = o.clean, id = o.id, R = rng(7 + (heavy ? 1 : 0));
    var cols = clamp(Math.round(3 + Math.sqrt(s) / 1.3), 4, 20), rows = clamp(Math.round(cols * 0.42), 2, 9);
    var FY = 272, FH = 248, tw = 640 / cols, th = FH / rows;
    var P0 = 0.08, P1 = 0.62;
    function pAt(x) { return Math.min(P0 + (P1 - P0) * (x + 60) / 800, 0.84); }
    var out = [bg(), rect(0, 0, 640, FY, C.ice2), '<polygon points="430,0 490,0 390,' + FY + " 330," + FY + '" fill="#e6eefb"/>'];

    // fenêtres (vitrages)
    if (vit) {
      [70, 240].forEach(function (wx, i) {
        var cid = id + "w" + i, a0 = 0.64 + i * 0.12, a1 = a0 + 0.13;
        out.push(rect(wx - 8, 46, 146, 166, C.navy, ' rx="5"'), rect(wx, 54, 130, 150, "#c4d5ee"));
        if (!clean) out.push(g("translate(0 0)", ['<ellipse cx="' + (wx + 30) + '" cy="90" rx="16" ry="9" fill="' + C.mute + '"/>', '<ellipse cx="' + (wx + 92) + '" cy="150" rx="20" ry="11" fill="' + C.mute + '"/>', '<ellipse cx="' + (wx + 60) + '" cy="180" rx="10" ry="6" fill="' + C.mute + '"/>'].join("")));
        out.push('<clipPath id="' + cid + '"><rect x="' + (wx - 140) + '" y="54" width="140" height="150"' + (clean ? ' transform="translate(140 0)"' : K([[0, 0, 0], [a0, 0, 0], [a1, 140, 0], [0.985, 140, 0], [0.99, 0, 0], [1, 0, 0]])) + "/></clipPath>");
        out.push('<g clip-path="url(#' + cid + ')"' + (clean ? "" : A("veil", 0)) + ">" + rect(wx, 54, 130, 150, "#f0f6ff") + '<polygon points="' + (wx + 30) + ",54 " + (wx + 56) + ",54 " + (wx + 16) + ",204 " + wx + ",204 " + wx + ',190" fill="#fff"/><polygon points="' + (wx + 92) + ",54 " + (wx + 104) + ",54 " + (wx + 64) + ",204 " + (wx + 52) + ',204" fill="#fff"/></g>');
        out.push(rect(wx + 62, 54, 6, 150, C.navy), rect(wx - 14, 210, 158, 8, C.navy2, ' rx="2"'));
        if (!clean) out.push("<g" + K([[0, wx - 10, 0], [a0, wx - 10, 0], [a1, wx + 128, 0], [1, wx + 128, 0]]) + ">" + rect(0, 60, 8, 138, C.navy, ' rx="3"') + rect(7, 68, 7, 122, C.blue2, ' rx="2"') + '<path d="M14 129 L48 150" stroke="' + C.navy + '" stroke-width="7" stroke-linecap="round"/></g>');
        out.push(star(wx + 100, 84, 13, a1 + 0.01, C.blue));
      });
    }
    // salissures murales (renforcé) : plâtre + coulures de peinture
    if (heavy && !clean) {
      var wallX = vit ? [430, 470, 520, 560, 600, 450] : [60, 150, 250, 330, 450, 560];
      wallX.forEach(function (x, i) {
        var y = 60 + R() * 150;
        out.push(g("translate(" + x + " " + r1(y) + ")", '<path' + A("vanish", pAt(x)) + ' d="M0 0c6-8 18-6 20 2s-4 14-12 13-14-7-8-15z" fill="#d9dfe9" stroke="#c3ccda" stroke-width="1.5"/>'));
        if (i % 2 === 0) out.push(g("translate(" + (x + 30) + " " + r1(40 + R() * 70) + ")", '<path' + A("vanish", pAt(x + 30)) + ' d="M-6 0c4-6 22-6 26 0 2 4-2 6-4 6v' + r1(26 + R() * 34) + 'a4 4 0 0 1-8 0v-14a3 3 0 0 0-6 0v8a3.5 3.5 0 0 1-7 0v-6c-3 0-4-2-1-6z" fill="' + C.blue2 + '" opacity=".75"/>'));
      });
    }
    // plinthe + sol sale
    out.push(rect(0, FY - 10, 640, 10, C.navy), rect(0, FY, 640, FH, heavy && !clean ? "#c1c9d6" : "#cfd6e2"));
    var grid = "";
    for (var c = 1; c < cols; c++) grid += '<line x1="' + r1(c * tw) + '" y1="' + FY + '" x2="' + r1(c * tw) + '" y2="520" stroke="{c}" stroke-width="1.5"/>';
    for (var r = 1; r < rows; r++) grid += '<line x1="0" y1="' + r1(FY + r * th) + '" x2="640" y2="' + r1(FY + r * th) + '" stroke="{c}" stroke-width="1.5"/>';
    out.push(grid.replace(/\{c\}/g, "#b6c0cf"));
    // sol propre (révélé derrière le balai)
    var cleanFloor = rect(0, FY, 640, FH, "#fbfdff") + grid.replace(/\{c\}/g, "#d9e5f6") +
      '<polygon points="70,' + FY + " 130," + FY + " 70,520 10,520" + '" fill="#fff"/><polygon points="300,' + FY + " 324," + FY + " 264,520 240,520" + '" fill="#fff"/><polygon points="470,' + FY + " 520," + FY + " 460,520 410,520" + '" fill="#fff"/>';
    if (clean) out.push(cleanFloor);
    else {
      out.push('<clipPath id="' + id + 'f"><rect x="-800" y="' + FY + '" width="1440" height="' + FH + '"' + K([[0, -700, 0], [P0, -700, 0], [P1, 100, 0], [0.985, 100, 0], [0.99, -700, 0], [1, -700, 0]]) + "/></clipPath>");
      out.push('<g clip-path="url(#' + id + 'f)"' + A("veil", 0) + ">" + cleanFloor + "</g>");
    }
    // marques des artisans
    if (rep && !clean) {
      for (var f = 0; f < 9; f++) {
        var fx = 40 + f * 64, fy = FY + 150 - f * 8 + (f % 2 ? 14 : 0);
        out.push(g("translate(" + fx + " " + fy + ") rotate(-12)", '<g' + A("vanish", pAt(fx)) + '><ellipse rx="9" ry="5" fill="#8796ae"/><ellipse cx="13" cy="1" rx="4" ry="4" fill="#8796ae"/></g>'));
      }
      [[120, FY + 60], [380, FY + 90], [520, FY + 40]].forEach(function (m) {
        out.push(g("translate(" + m[0] + " " + m[1] + ")", '<path' + A("vanish", pAt(m[0])) + ' d="M0 0l40 6M6 10l30 3" stroke="#7d8ca6" stroke-width="3" stroke-linecap="round"/>'));
      });
      out.push(g("translate(560 " + (FY + 168) + ")", '<g' + A("vanish", pAt(560)) + '>' + rect(0, 12, 56, 30, C.navy2, ' rx="4"') + '<path d="M16 12v-8h24v8" stroke="' + C.navy2 + '" stroke-width="4" fill="none"/>' + rect(0, 22, 56, 4, C.blue2) + "</g>"));
    }
    // fin de bail : logement vidé, cartons, porte d'entrée et clés à rendre
    if (bail) {
      out.push(rect(500, 92, 96, FY - 102, C.navy, ' rx="3"'), rect(508, 100, 80, FY - 110, C.blue), rect(516, 112, 64, 60, "#2a72cf", ' rx="2"'), rect(516, 182, 64, 60, "#2a72cf", ' rx="2"'), '<circle cx="574" cy="' + (FY - 80) + '" r="5" fill="#fff"/>');
      out.push(rect(452, 120, 18, 5, C.navy2, ' rx="2"'));
      out.push(g("translate(461 125)", '<g' + A("sway", 0, ' style="transform-origin:top"') + '><line x1="0" y1="0" x2="0" y2="14" stroke="' + C.navy + '" stroke-width="2"/><circle cy="24" r="10" fill="none" stroke="' + C.blue2 + '" stroke-width="4"/><path d="M0 34v22M0 46h7M0 52h6" stroke="' + C.blue2 + '" stroke-width="4" stroke-linecap="round"/></g>'));
      [[40, 0, 96, 70], [56, -62, 72, 62], [150, 0, 84, 60], [380, 0, 90, 64]].forEach(function (b, i) {
        var bx = b[0], by = FY + 118 + b[1] - b[2] * 0 , bw = b[2], bh = b[3];
        out.push(g("translate(" + bx + " " + (FY + 110 + b[1] - bh + 70) + ")", rect(0, 0, bw, bh, "#dbc59b", ' rx="3" stroke="#a88b5a" stroke-width="2.5"') + rect(0, 0, bw, 12, "#c9ae7d") + rect(bw / 2 - 7, 0, 14, bh, "#e8d8b4", ' opacity=".8"') + (i === 0 ? text(bw / 2, bh / 2 + 12, "CUISINE", 11, "#7a6136", 800, "middle") : "")));
      });
      out.push(star(560, 150, 14, 0.7, "#fff"));
    }
    // poussière
    if (!clean) {
      var nd = heavy ? 46 : 16;
      for (var i = 0; i < nd; i++) {
        var x = 10 + R() * 620, y = FY + 12 + R() * (FH - 24), rr = heavy ? 2.5 + R() * 3 : 1.8 + R() * 2;
        out.push(g("translate(" + r1(x) + " " + r1(y) + ")", '<circle' + A("vanish", pAt(x)) + ' r="' + r1(rr) + '" fill="' + C.dust + '"/>'));
      }
      if (heavy) {
        [[90, FY + 40, 46], [230, FY + 110, 60], [380, FY + 60, 50], [520, FY + 140, 58], [600, FY + 70, 40]].forEach(function (cl, j) {
          out.push(g("translate(" + cl[0] + " " + cl[1] + ")", '<g' + A("bob", j * 0.3) + '><g' + A("vanish", pAt(cl[0])) + '><ellipse rx="' + cl[2] + '" ry="' + r1(cl[2] * 0.36) + '" fill="#b7c1d1" opacity=".55"/><ellipse cx="' + r1(-cl[2] * 0.4) + '" cy="-10" rx="' + r1(cl[2] * 0.5) + '" ry="' + r1(cl[2] * 0.3) + '" fill="#b7c1d1" opacity=".45"/></g></g>'));
        });
      }
      // aspirateur (renforcé)
      if (heavy) out.push("<g" + K([[0, -170, 0], [0.14, -170, 0], [0.7, 660, 0], [1, 660, 0]]) + ">" + g("translate(0 " + (FY + 168) + ")",
        rect(0, 0, 70, 40, C.navy, ' rx="14"') + '<circle cx="14" cy="42" r="8" fill="' + C.navy2 + '"/><circle cx="56" cy="42" r="8" fill="' + C.navy2 + '"/>' + rect(10, 8, 30, 8, C.blue2, ' rx="4"') +
        '<path d="M70 18c30 0 34 -20 60 -12" stroke="' + C.navy + '" stroke-width="5" fill="none"/>' + rect(124, -12, 40, 12, C.blue, ' rx="3"')) + "</g>");
      // balai
      out.push("<g" + K([[0, -120, 0], [P0, -120, 0], [P1, 680, 0], [1, 680, 0]]) + ">" + g("translate(0 " + (FY - 150) + ")",
        '<line x1="86" y1="0" x2="44" y2="196" stroke="' + C.navy + '" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M12 196 H 78 L 90 236 H 0 Z" fill="' + C.blue + '"/><path d="M10 210H82M6 224H88" stroke="#1f63bd" stroke-width="2"/>') + "</g>");
    }
    // cotation de la surface
    out.push(g("translate(0 492)", rect(24, 0, 592, 2, C.navy) + rect(24, -8, 2, 18, C.navy) + rect(614, -8, 2, 18, C.navy) +
      rect(262, -16, 116, 32, C.navy, ' rx="16"') + text(320, 6, fr(s) + " m²", 17, "#fff", 800, "middle")));
    out.push(star(150, FY + 70, 16, 0.66), star(330, FY + 120, 22, 0.72), star(500, FY + 60, 13, 0.78, C.navy));
    return {
      T: 8200, svg: out.join(""), label: bail ? "Fin de bail" : "Fin de chantier",
      caption: fr(s) + " m², " + (bail ? "fin de bail / déménagement" : "nettoyage " + (heavy ? "renforcé" : "standard")) + (vit ? ", vitrages" : "") + (rep ? ", reprise après artisans" : "")
    };
  }

  /* ---------- hôtelier ---------- */
  function sceneHotel(v, o) {
    var type = v.ho_type || "chambres", clean = o.clean, out = [bg()];
    if (type === "renfort") {
      var h = clamp(num(v.ho_hours, 8), 0.5, 2000), frac = Math.min(h, 12) / 12, cx = 180, cy = 230, R0 = 130;
      var a = frac * Math.PI * 2, x2 = cx + R0 * Math.sin(a), y2 = cy - R0 * Math.cos(a);
      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (R0 + 12) + '" fill="' + C.navy + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="#fff"/>');
      out.push(frac >= 1 ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="' + C.blue2 + '" opacity=".28"/>' :
        '<path d="M' + cx + " " + cy + "L" + cx + " " + (cy - R0) + "A" + R0 + " " + R0 + " 0 " + (frac > 0.5 ? 1 : 0) + " 1 " + r1(x2) + " " + r1(y2) + 'Z" fill="' + C.blue2 + '" opacity=".28"/>');
      for (var t = 0; t < 12; t++) { var ta = t / 12 * Math.PI * 2; out.push('<line x1="' + r1(cx + 112 * Math.sin(ta)) + '" y1="' + r1(cy - 112 * Math.cos(ta)) + '" x2="' + r1(cx + 124 * Math.sin(ta)) + '" y2="' + r1(cy - 124 * Math.cos(ta)) + '" stroke="' + C.navy + '" stroke-width="' + (t % 3 ? 3 : 6) + '"/>'); }
      out.push('<g' + A("spin", 0, ' data-dur="6000"') + '><circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="none"/><line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy - 100) + '" stroke="' + C.blue + '" stroke-width="7" stroke-linecap="round"/></g>');
      out.push('<g' + A("spin", 0, ' data-dur="72000"') + '><circle cx="' + cx + '" cy="' + cy + '" r="' + R0 + '" fill="none"/><line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + 62) + '" y2="' + cy + '" stroke="' + C.navy + '" stroke-width="9" stroke-linecap="round"/></g>');
      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="' + C.navy + '"/>', text(cx, 440, fr(h) + " h", 56, C.navy, 900, "middle", ' font-style="italic"'));
      var staff = clamp(Math.ceil(h / 7), 1, 8);
      for (var i = 0; i < staff; i++) {
        var col = i % 4, row = Math.floor(i / 4), sx = 370 + col * 64, sy = (staff > 4 ? 120 : 200) + row * 170;
        out.push(g("translate(" + sx + " " + sy + ")", '<g' + A("pop", 0.1 + i * 0.12) + '><g' + A("bob", i * 0.2) + '>' +
          '<circle cx="24" cy="18" r="17" fill="' + C.navy + '"/><path d="M0 120V66a24 24 0 0 1 48 0v54z" fill="' + C.navy + '"/>' +
          rect(10, 70, 28, 40, C.blue2, ' rx="4"') + rect(14, 76, 20, 4, "#fff", ' opacity=".6"') + "</g></g>"));
      }
      if (h > 56) out.push(badge(620, 30, "+ équipe"));
      return { T: 6000, svg: out.join(""), label: "Renfort de personnel", caption: fr(h) + " h de renfort, " + staff + " personne" + (staff > 1 ? "s" : "") + " représentée" + (staff > 1 ? "s" : "") };
    }
    if (type === "grand") {
      var id = o.id;
      out.push(rect(0, 0, 640, 340, C.ice2), rect(380, 40, 210, 200, C.navy, ' rx="6"'), rect(392, 52, 186, 176, "#dbe8fb"), '<polygon points="470,52 510,52 450,228 410,228" fill="#fff" opacity=".7"/>');
      out.push('<g' + A("sway", 0, ' style="transform-origin:top"') + '><path d="M372 30h70v230c-12 6-24-6-36 0s-24 6-34 0z" fill="' + C.blue + '"/><path d="M392 30v226M412 30v228" stroke="#1f63bd" stroke-width="3"/></g>');
      out.push('<g' + A("sway", 0.4, ' style="transform-origin:top"') + '><path d="M528 30h70v230c-12 6-24-6-36 0s-24 6-34 0z" fill="' + C.blue + '"/><path d="M548 30v226M568 30v228" stroke="#1f63bd" stroke-width="3"/></g>');
      out.push(rect(360, 22, 250, 10, C.navy, ' rx="5"'));
      out.push(rect(30, 150, 24, 180, C.navy, ' rx="9"'), rect(30, 300, 320, 30, C.navy2, ' rx="6"'), rect(54, 260, 296, 44, "#fff", ' rx="10" stroke="#c6d6ee" stroke-width="2"'), rect(140, 252, 210, 58, C.blue, ' rx="10"'), rect(140, 252, 210, 14, "#fff"), rect(64, 232, 70, 32, "#fff", ' rx="14" stroke="#b5c9e8" stroke-width="2"'));
      // moquette
      out.push(rect(0, 340, 640, 180, "#b9c6da"));
      if (!clean) {
        var R = rng(3);
        for (var sI = 0; sI < 9; sI++) { var stx = 30 + R() * 580; out.push(g("translate(" + r1(stx) + " " + r1(370 + R() * 120) + ")", '<ellipse' + A("vanish", Math.min(0.08 + 0.6 * (stx + 40) / 760, 0.84)) + ' rx="' + r1(14 + R() * 18) + '" ry="' + r1(6 + R() * 6) + '" fill="#8e9db6"/>')); }
      }
      var carpet = rect(0, 340, 640, 180, "#dbe8fb") + '<path d="M0 380H640M0 430H640M0 480H640" stroke="#c9daf3" stroke-width="2"/>';
      if (clean) out.push(carpet); else {
        out.push('<clipPath id="' + id + 'c"><rect x="-800" y="340" width="1440" height="180"' + K([[0, -760, 0], [0.08, -760, 0], [0.68, 40, 0], [0.985, 40, 0], [0.99, -760, 0], [1, -760, 0]]) + "/></clipPath>");
        out.push('<g clip-path="url(#' + id + 'c)"' + A("veil", 0) + ">" + carpet + "</g>");
        out.push("<g" + K([[0, -150, 0], [0.08, -150, 0], [0.68, 650, 0], [1, 650, 0]]) + ">" + g("translate(0 380)", rect(0, 40, 90, 50, C.navy, ' rx="10"') + '<circle cx="18" cy="94" r="10" fill="' + C.navy2 + '"/><circle cx="72" cy="94" r="10" fill="' + C.navy2 + '"/>' + rect(10, 50, 50, 10, C.blue2, ' rx="5"') + '<line x1="30" y1="40" x2="-10" y2="-60" stroke="' + C.navy + '" stroke-width="7" stroke-linecap="round"/>' + '<circle cx="100" cy="70" r="7" fill="#fff" opacity=".9"/><circle cx="112" cy="58" r="5" fill="#fff" opacity=".8"/>') + "</g>");
      }
      [[100, 120, 18, 0.7], [250, 200, 14, 0.74], [480, 140, 22, 0.78], [560, 400, 16, 0.8], [220, 440, 20, 0.72], [400, 300, 12, 0.76]].forEach(function (s) { out.push(star(s[0], s[1], s[2], s[3])); });
      return { T: 7600, svg: out.join(""), label: "Grand nettoyage", caption: "Rideaux, literie, moquette : remise en état complète, sur devis" };
    }
    // entretien des chambres
    var n = clamp(Math.round(num(v.ho_rooms, 10)), 1, 2000), vis = Math.min(n, 12), rowsN = vis > 6 ? 2 : 1, per = Math.ceil(vis / rowsN);
    var sel = v.ho_freq_n || num(v.ho_freq, 1);
    out.push(rect(0, 0, 640, 430, C.ice2));
    var sp = 600 / per, dw = clamp(sp * 0.55, 34, 70), dh = rowsN === 2 ? 128 : 170;
    var k = 0;
    for (var rr = 0; rr < rowsN; rr++) {
      var y0 = rowsN === 2 ? 40 + rr * 196 : 150, cnt = rr === rowsN - 1 ? vis - per * (rowsN - 1) : per;
      out.push(rect(0, y0 + dh, 640, 10, C.navy2));
      for (var d = 0; d < cnt; d++) {
        var x = 20 + sp * d + (sp - dw) / 2, p = 0.06 + 0.7 * k / vis, num_ = (rowsN === 2 ? (2 - rr) : 1) * 100 + d + 1;
        out.push(rect(x - 5, y0 + 22, dw + 10, dh - 22, C.navy, ' rx="4"'), rect(x, y0 + 28, dw, dh - 28, C.blue, ""), rect(x + 6, y0 + 38, dw - 12, (dh - 50) / 2 - 4, "#2a72cf", ' rx="2"'), rect(x + 6, y0 + 38 + (dh - 50) / 2 + 4, dw - 12, (dh - 50) / 2 - 4, "#2a72cf", ' rx="2"'),
          '<circle cx="' + r1(x + dw - 9) + '" cy="' + r1(y0 + 28 + (dh - 28) / 2) + '" r="3.5" fill="#fff"/>',
          text(x + dw / 2 - 8, y0 + 16, String(num_), 13, C.navy, 800, "middle"),
          '<circle cx="' + r1(x + dw / 2 + 16) + '" cy="' + r1(y0 + 11) + '" r="5.5" fill="' + (clean ? C.blue : C.blue) + '"' + (clean ? "" : A("light", p, ' data-off="' + C.grey + '" data-on="' + C.blue + '"')) + "/>");
        out.push(star(x + dw - 2, y0 + 40, 11, p + 0.02, "#fff"));
        k++;
      }
    }
    if (n > 12) out.push(badge(626, 6, "+" + (n - 12) + " chambres"));
    // chariot d'étage
    if (!clean) {
      var cy0 = (rowsN === 2 ? 236 : 150) + dh - 50;
      out.push("<g" + K([[0, -80, 0], [0.04, -80, 0], [0.8, 640, 0], [1, 640, 0]]) + ">" + g("translate(0 " + cy0 + ")",
        rect(0, 0, 62, 42, "#fff", ' rx="4" stroke="' + C.navy + '" stroke-width="3"') + rect(6, 6, 22, 10, C.blue2, ' rx="2"') + rect(32, 6, 22, 10, "#dbe8fb", ' rx="2"') + rect(6, 20, 48, 10, "#dbe8fb", ' rx="2"') +
        '<line x1="62" y1="4" x2="76" y2="-10" stroke="' + C.navy + '" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="46" r="5" fill="' + C.navy + '"/><circle cx="50" cy="46" r="5" fill="' + C.navy + '"/>') + "</g>");
    }
    // calendrier du mois
    out.push(rect(0, 430, 640, 90, "#dce7f7"), text(20, 456, "Passages sur un mois", 13, C.navy, 700));
    var passes = Math.min(30, Math.round(sel)), idx = {};
    for (var q = 0; q < passes; q++) idx[Math.min(29, Math.round((q + 0.5) * 30 / passes - 0.5))] = q;
    for (var dd = 0; dd < 30; dd++) {
      var on = idx.hasOwnProperty(dd), qx = 20 + dd * 20;
      out.push(rect(qx, 466, 17, 36, on ? C.blue : "#fff", ' rx="3"' + (on && !clean ? A("light", 0.05 + 0.8 * idx[dd] / Math.max(passes, 1), ' data-off="#fff" data-on="' + C.blue + '"') : "") + (on ? "" : ' stroke="' + C.line + '"')));
    }
    var freqTxt = passes <= 1 ? "intervention ponctuelle" : "≈ " + passes + " passages par mois";
    return { T: 7000, svg: out.join(""), label: "Entretien des chambres", caption: n + " chambre" + (n > 1 ? "s" : "") + ", " + freqTxt };
  }

  /* ---------- parties communes ---------- */
  function building(floors, o, opts) {
    var out = [], X = 30, Wb = 270, top = 40, bottom = 490, fh = (bottom - top) / floors, id = o.id, clean = o.clean, R = rng(11);
    out.push(rect(X - 6, top - 14, Wb + 12, 14, C.navy, ' rx="3"'), rect(X, top, Wb, bottom - top, "#fff", ' stroke="' + C.navy + '" stroke-width="5"'));
    for (var f = 0; f < floors; f++) {
      var y1 = bottom - (f + 1) * fh, y2 = bottom - f * fh, p0 = 0.05 + 0.7 * f / floors, p1 = p0 + 0.7 / floors;
      var stairs = "", steps = 6, swd = 150 / steps, sh = (fh - 10) / steps;
      for (var s = 0; s < steps; s++) stairs += (s === 0 ? "M" : "L") + r1(X + 70 + s * swd) + " " + r1(y2 - s * sh) + "L" + r1(X + 70 + s * swd) + " " + r1(y2 - (s + 1) * sh);
      stairs += "L" + r1(X + 70 + steps * swd) + " " + r1(y2 - steps * sh) + "L" + r1(X + 70 + steps * swd) + " " + y2 + "Z";
      var dirty = '<path d="' + stairs + '" fill="' + (opts.grime ? "#a9b4c6" : "#c9d1de") + '"/>';
      var cleanL = '<path d="' + stairs + '" fill="#fff" stroke="' + C.blue + '" stroke-width="2.5"/>';
      out.push(dirty);
      if (!clean) {
        var n = opts.grime ? 7 : 3;
        for (var d = 0; d < n; d++) out.push('<ellipse cx="' + r1(X + 20 + R() * (Wb - 40)) + '" cy="' + r1(y1 + 10 + R() * (fh - 20)) + '" rx="' + r1(opts.grime ? 8 + R() * 10 : 3 + R() * 3) + '" ry="' + r1(opts.grime ? 4 + R() * 4 : 2 + R() * 2) + '" fill="' + (opts.grime ? "#8d9bb4" : C.dust) + '"' + A("vanish", Math.min(p0 + 0.6 * (p1 - p0), 0.84)) + "/>");
        out.push('<clipPath id="' + id + "fl" + f + '"><rect x="' + (X - Wb) + '" y="' + r1(y1) + '" width="' + Wb + '" height="' + r1(fh) + '"' + K([[0, 0, 0], [p0, 0, 0], [p1, Wb, 0], [0.985, Wb, 0], [0.99, 0, 0], [1, 0, 0]]) + "/></clipPath>");
        out.push('<g clip-path="url(#' + id + "fl" + f + ')"' + A("veil", 0) + ">" + rect(X + 3, y1 + 3, Wb - 6, fh - 6, "#f6faff") + cleanL + "</g>");
      } else out.push(rect(X + 3, y1 + 3, Wb - 6, fh - 6, "#f6faff") + cleanL);
      out.push(rect(X, y1 - 2, Wb, 5, C.navy2));
      out.push('<circle cx="' + (X + Wb - 30) + '" cy="' + r1(y1 + 16) + '" r="6" fill="' + C.blue + '"' + (clean ? "" : A("light", p1, ' data-off="' + C.grey + '" data-on="' + C.blue + '"')) + "/>");
      out.push(text(X + Wb + 14, y2 - 8, f === 0 ? "RDC" : f + (f === 1 ? "er" : "e"), 12, C.navy, 700));
      out.push(star(X + 150, y1 + fh / 2, 12, p1 - 0.01));
    }
    out.push(rect(X + Wb - 64, bottom - 56, 40, 56, "#dbe8fb", ' stroke="' + C.navy + '" stroke-width="3"'));
    return out.join("");
  }
  function calendar(x, y, w, h, passDays, o, allOn) {
    var out = [], cw = w / 7, ch = (h - 30) / 5, days = "LMMJVSD";
    for (var i = 0; i < 7; i++) out.push(text(x + cw * i + cw / 2, y + 16, days[i], 13, C.navy, 800, "middle"));
    var order = {};
    passDays.forEach(function (d, i) { order[d] = i; });
    for (var dI = 0; dI < 31; dI++) {
      var cx = x + (dI % 7) * cw, cy = y + 28 + Math.floor(dI / 7) * ch, on = allOn || order.hasOwnProperty(dI);
      var fill = allOn ? "#cfe0f8" : on ? C.blue2 : "#fff";
      out.push(rect(cx + 2, cy + 2, cw - 4, ch - 4, fill, ' rx="5"' + (on ? "" : ' stroke="' + C.line + '"') + (on && !allOn && !o.clean ? A("light", 0.05 + 0.8 * order[dI] / Math.max(passDays.length, 1),  ' data-off="#fff" data-on="' + C.blue2 + '"') : "")));
      out.push(text(cx + 8, cy + 17, String(dI + 1), 11, C.navy, 700));
    }
    return out.join("");
  }
  function sceneParties(v, o) {
    var type = v.pc_type || "regulier", out = [bg()];
    if (type === "forfait") {
      out.push(building(6, { id: o.id, clean: true }, {}));
      out.push(rect(350, 50, 270, 340, "#fff", ' rx="12" stroke="' + C.line + '" stroke-width="2"'), calendar(358, 62, 254, 320, [], o, true));
      out.push(g("translate(440 300)", '<g' + A("pop", 0.3) + '><g' + A("bob", 0) + '>' + rect(0, 0, 150, 186, "#fff", ' rx="8" stroke="' + C.navy + '" stroke-width="3"') + rect(0, 0, 150, 40, C.navy, ' rx="8"') + rect(0, 30, 150, 10, C.navy) +
        text(75, 27, "Forfait", 17, "#fff", 800, "middle") + '<path d="M18 62h114M18 82h114M18 102h90M18 122h104" stroke="' + C.line + '" stroke-width="5" stroke-linecap="round"/><circle cx="110" cy="152" r="20" fill="' + C.blue + '"/><path d="M100 152l7 7 13-14" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></g></g>'));
      out.push(star(120, 150, 16, 0.2), star(220, 330, 14, 0.5), star(160, 420, 18, 0.8));
      return { T: 6000, svg: out.join(""), label: "Forfait mensuel d’immeuble", caption: "Tout le mois couvert, sur devis après visite" };
    }
    if (type === "remise") {
      out.push(building(5, o, { grime: true }));
      out.push(g("translate(470 120)", '<g' + A("pop", 0.2) + ">" + rect(-90, 0, 180, 210, "#fff", ' rx="14" stroke="' + C.navy + '" stroke-width="3"') + rect(-90, 0, 180, 52, C.navy, ' rx="14"') + rect(-90, 38, 180, 14, C.navy) +
        text(0, 34, "Intervention", 18, "#fff", 800, "middle") + text(0, 140, "1", 84, C.blue, 900, "middle", ' font-style="italic"') + text(0, 185, "remise en état", 16, C.navy, 700, "middle") + "</g>"));
      out.push(g("translate(410 380)", rect(0, 40, 70, 60, C.blue, ' rx="6"') + '<path d="M10 40c0-30 50-30 50 0" stroke="' + C.navy + '" stroke-width="5" fill="none"/>' + '<line x1="110" y1="100" x2="150" y2="-40" stroke="' + C.navy + '" stroke-width="7" stroke-linecap="round"/>' + rect(84, 92, 56, 14, C.blue2, ' rx="4"')));
      return { T: 7600, svg: out.join(""), label: "Remise en état ponctuelle", caption: "Escaliers, halls et paliers remis à neuf, sur devis" };
    }
    var h = clamp(num(v.pc_hours, 2), 0.5, 100), vis = clamp(Math.round(num(v.pc_visits, 4)), 1, 62);
    var floors = clamp(Math.round(h * 2), 2, 8), passes = Math.min(vis, 31), pd = [];
    for (var i = 0; i < passes; i++) pd.push(Math.min(30, Math.floor(i * 31 / passes)));
    out.push(building(floors, o, {}));
    out.push(rect(350, 50, 270, 340, "#fff", ' rx="12" stroke="' + C.line + '" stroke-width="2"'), calendar(358, 62, 254, 320, pd, o, false));
    out.push(g("translate(350 410)", rect(0, 0, 270, 70, C.navy, ' rx="12"') + icon("check", 18, 20, 30, "#fff") +
      text(60, 32, passes + " passage" + (passes > 1 ? "s" : "") + " ce mois-ci", 17, "#fff", 800) + text(60, 54, fr(h) + " h par passage, " + fr(h * vis) + " h au total", 13, "#cfe0f8", 600)));
    return { T: 7600, svg: out.join(""), label: "Parties communes", caption: fr(h) + " h par passage, " + vis + " passage" + (vis > 1 ? "s" : "") + " par mois" };
  }

  /* ---------- mobilier & vitrerie ---------- */
  function sofa(w, stains, pBase, clean) {
    var h = w * 0.56, s = w / 200;
    var out = rect(0, 0, w, h * 0.5, C.navy2, ' rx="' + r1(16 * s) + '"') + rect(-10 * s, h * 0.3, 32 * s, h * 0.62, C.navy, ' rx="' + r1(10 * s) + '"') + rect(w - 22 * s, h * 0.3, 32 * s, h * 0.62, C.navy, ' rx="' + r1(10 * s) + '"') +
      rect(14 * s, h * 0.4, w / 2 - 16 * s, h * 0.32, C.blue, ' rx="' + r1(8 * s) + '"') + rect(w / 2 + 2 * s, h * 0.4, w / 2 - 16 * s, h * 0.32, C.blue, ' rx="' + r1(8 * s) + '"') +
      rect(6 * s, h * 0.68, w - 12 * s, h * 0.22, C.navy2, ' rx="' + r1(6 * s) + '"') + rect(14 * s, h * 0.9, 8 * s, h * 0.1, C.navy) + rect(w - 22 * s, h * 0.9, 8 * s, h * 0.1, C.navy);
    if (!clean) stains.forEach(function (st, i) {
      out += g("translate(" + r1(st[0] * w) + " " + r1(st[1] * h) + ")", '<ellipse' + A("vanish", pBase + i * 0.03) + ' rx="' + r1(st[2] * s) + '" ry="' + r1(st[2] * s * 0.45) + '" fill="#163f85"/>');
      out += g("translate(" + r1(st[0] * w) + " " + r1(st[1] * h - 4) + ")", '<circle' + A("pulse", pBase - 0.02) + ' r="' + r1(5 * s + 2) + '" fill="#fff" stroke="#bcd3f3" opacity="0"/>');
    });
    return { svg: out + star(w * 0.5, h * 0.25, 10 + 6 * s, pBase + 0.08, "#fff"), h: h };
  }
  function mattress(w, pBase, clean) {
    var h = w * 0.42, s = w / 200, out = rect(0, h * 0.12, w, h * 0.78, "#fff", ' rx="' + r1(12 * s) + '" stroke="#9fb7dc" stroke-width="2"') + rect(0, h * 0.62, w, h * 0.12, "#dbe8fb") +
      '<path d="M' + r1(w * 0.25) + " " + r1(h * 0.18) + "V" + r1(h * 0.6) + "M" + r1(w * 0.5) + " " + r1(h * 0.18) + "V" + r1(h * 0.6) + "M" + r1(w * 0.75) + " " + r1(h * 0.18) + "V" + r1(h * 0.6) + '" stroke="#cfe0f8" stroke-width="2"/>';
    if (!clean) [[0.3, 0.35, 18], [0.66, 0.45, 14]].forEach(function (st, i) {
      out += g("translate(" + r1(st[0] * w) + " " + r1(st[1] * h) + ")", '<ellipse' + A("vanish", pBase + i * 0.03) + ' rx="' + r1(st[2] * s) + '" ry="' + r1(st[2] * s * 0.5) + '" fill="#b4bfd0"/>');
    });
    return { svg: out + star(w * 0.82, h * 0.2, 9 + 5 * s, pBase + 0.08), h: h };
  }
  // rideaux : panneaux plissés qui ondulent, taches qui disparaissent
  function curtains(x, y, w, h, n, clean) {
    var k = Math.min(n, 4), pw = w / k, out = rect(x - 8, y - 10, w + 16, 9, C.navy, ' rx="4"');
    for (var i = 0; i < k; i++) {
      var px = x + i * pw + 3, ww = pw - 6, p = 0.15 + 0.55 * i / k;
      var folds = "";
      for (var f = 1; f < 4; f++) folds += '<path d="M' + r1(px + ww * f / 4) + " " + y + "V" + r1(y + h - 6) + '" stroke="#1f63bd" stroke-width="2.5"/>';
      var panel = '<path d="M' + r1(px) + " " + y + "h" + r1(ww) + "v" + r1(h) + "c" + r1(-ww / 4) + " 8 " + r1(-ww / 2) + " -6 " + r1(-ww * 0.75) + " 0s" + r1(-ww / 4) + " -6 " + r1(-ww / 4) + ' 0z" fill="' + C.blue + '"/>' + folds;
      if (!clean) panel += g("translate(" + r1(px + ww * 0.45) + " " + r1(y + h * 0.55) + ")", '<ellipse' + A("vanish", p) + ' rx="' + r1(ww * 0.22) + '" ry="' + r1(ww * 0.12) + '" fill="#163f85"/>');
      out += '<g' + A("sway", i * 0.3, ' style="transform-origin:top"') + ">" + panel + "</g>";
      out += star(px + ww * 0.5, y + h * 0.35, 11, p + 0.08, "#fff");
    }
    if (n > 4) out += badge(x + w + 8, y + h + 8, "+" + (n - 4));
    return out;
  }
  function sceneMobilier(v, o) {
    var c = clamp(Math.round(num(v.mo_sofas, 0)), 0, 200), m = clamp(Math.round(num(v.mo_mattress, 0)), 0, 200), w = !!v.mo_windows, clean = o.clean;
    var cu = clamp(Math.round(num(v.mo_curtains, 0)), 0, 200);
    var out = [bg(), rect(0, 470, 640, 50, "#dce7f7")];
    if (!c && !m && !w && !cu) {
      out.push(text(320, 250, "Ajoutez un canapé, un matelas,", 24, C.navy, 800, "middle"), text(320, 282, "des rideaux ou des vitres", 24, C.navy, 800, "middle"));
      return { T: 6000, svg: out.join(""), label: "Mobilier & vitrerie", caption: "Indiquez au moins un élément à nettoyer" };
    }
    var side = w || cu, items = c || m;
    var areaX = 24, areaW = side && items ? 420 : 592;
    if (cu && !w) {
      var cw0 = items ? 140 : 300, cx0 = items ? 470 : 170;
      out.push(curtains(cx0, items ? 40 : 70, cw0, items ? 250 : 360, cu, clean));
    }
    if (w) {
      var wx = c || m ? 470 : 200, ww = c || m ? 140 : 240, wh = c || m ? 230 : 300, wy = c || m ? 40 : 80, id = o.id + "v";
      out.push(rect(wx - 10, wy - 10, ww + 20, wh + 20, C.navy, ' rx="6"'), rect(wx, wy, ww, wh, "#c4d5ee"));
      if (!clean) [[0.25, 0.2, 14], [0.7, 0.4, 18], [0.35, 0.7, 12], [0.8, 0.85, 10]].forEach(function (s) {
        out.push('<ellipse cx="' + r1(wx + s[0] * ww) + '" cy="' + r1(wy + s[1] * wh) + '" rx="' + s[2] + '" ry="' + r1(s[2] * 0.6) + '" fill="' + C.mute + '"/>');
      });
      var glass = rect(wx, wy, ww, wh, "#f0f6ff") + '<polygon points="' + r1(wx + ww * 0.2) + "," + wy + " " + r1(wx + ww * 0.36) + "," + wy + " " + r1(wx + ww * 0.06) + "," + (wy + wh) + " " + wx + "," + (wy + wh) + " " + wx + "," + r1(wy + wh * 0.8) + '" fill="#fff"/>';
      if (clean) out.push(glass); else {
        out.push('<clipPath id="' + id + '"><rect x="' + (wx - ww) + '" y="' + wy + '" width="' + ww + '" height="' + wh + '"' + K([[0, 0, 0], [0.1, 0, 0], [0.5, ww, 0], [0.985, ww, 0], [0.99, 0, 0], [1, 0, 0]]) + "/></clipPath>");
        out.push('<g clip-path="url(#' + id + ')"' + A("veil", 0) + ">" + glass + "</g>");
        out.push("<g" + K([[0, wx - 12, 0], [0.1, wx - 12, 0], [0.5, wx + ww - 4, 0], [1, wx + ww - 4, 0]]) + ">" + rect(0, wy + 8, 9, wh - 16, C.navy, ' rx="3"') + rect(8, wy + 16, 7, wh - 32, C.blue2, ' rx="2"') + '<path d="M15 ' + r1(wy + wh / 2) + 'L50 ' + r1(wy + wh / 2 + 24) + '" stroke="' + C.navy + '" stroke-width="8" stroke-linecap="round"/></g>');
      }
      out.push(rect(wx + ww / 2 - 3, wy, 6, wh, C.navy), rect(wx - 16, wy + wh + 8, ww + 32, 9, C.navy2, ' rx="2"'), star(wx + ww * 0.7, wy + 40, 16, 0.52));
      if (cu) { out.push(curtains(wx - 26, wy - 12, 34, wh + 30, 1, clean), curtains(wx + ww - 8, wy - 12, 34, wh + 30, 1, clean)); if (cu > 2) out.push(badge(wx + ww + 26, wy + wh + 24, "+" + (cu - 2))); }
    }
    var rowsDef = [];
    if (c) rowsDef.push(["sofa", Math.min(c, 6), c]);
    if (m) rowsDef.push(["mat", Math.min(m, 6), m]);
    var total = rowsDef.reduce(function (a, r) { return a + r[1]; }, 0), idx = 0;
    var rowH = rowsDef.length === 2 ? 210 : 300, yStart = rowsDef.length === 2 ? 40 : 110;
    rowsDef.forEach(function (row, ri) {
      var count = row[1], perRow = count > 2 ? Math.ceil(count / 2) : count, lines = Math.ceil(count / perRow);
      var cell = areaW / perRow, lineMax = (rowsDef.length === 2 ? 210 : 300) / lines - 14;
      var iw = Math.min(220, cell - 26, lineMax / (row[0] === "sofa" ? 0.56 : 0.42));
      for (var i = 0; i < count; i++) {
        var col = i % perRow, ln = Math.floor(i / perRow), p = 0.12 + 0.6 * idx / Math.max(total, 1);
        var item = row[0] === "sofa" ? sofa(iw, [[0.3, 0.52, 16], [0.7, 0.58, 20]], p, clean) : mattress(iw, p, clean);
        var lineH = rowH / lines, x = areaX + col * cell + (cell - iw) / 2, y = yStart + ri * (rowH + 20) + ln * lineH + (lineH - item.h) / 2 + 6;
        out.push(g("translate(" + r1(x) + " " + r1(y) + ")", item.svg));
        idx++;
      }
      if (row[2] > row[1]) out.push(badge(areaX + areaW, yStart + ri * (rowH + 20) - 4, "+" + (row[2] - row[1])));
    });
    var parts = [];
    if (c) parts.push(c + " canapé" + (c > 1 ? "s" : "") + " / fauteuil" + (c > 1 ? "s" : ""));
    if (m) parts.push(m + " matelas / textile");
    if (cu) parts.push(cu + " rideau" + (cu > 1 ? "x" : ""));
    if (w) parts.push("vitres");
    return { T: 6800, svg: out.join(""), label: "Mobilier & vitrerie", caption: parts.join(", ") };
  }

  /* ---------- ascenseurs ---------- */
  function sceneAsc(v, o) {
    var cnt = clamp(Math.round(num(v.as_count, 1)), 1, 100), vis = Math.min(cnt, 6), scope = v.as_scope || [], clean = o.clean;
    function has(re) { return scope.some(function (s) { return re.test(s); }); }
    var Z = { cab: has(/Cabine/), portes: has(/Portes/), fosse: has(/fosse/i), toit: has(/Toit/), mach: has(/Machinerie/), vitr: has(/Vitrages/) };
    var gap = 22, sw = Math.min(118, (580 - (vis - 1) * gap) / vis), total = vis * sw + (vis - 1) * gap, x0 = (640 - total) / 2;
    var out = [bg(), rect(0, 490, 640, 30, "#dce7f7")];
    var hi = C.blue, off = "#c9d4e6";
    var levels = [190, 300, 410];
    for (var i = 0; i < vis; i++) {
      var x = x0 + i * (sw + gap), showLock = sw >= 70 || i === 0, rev = i % 2 === 1;
      // machinerie
      out.push(rect(x - 4, 18, sw + 8, 60, Z.mach ? "#dbe8fb" : "#e4e9f1", ' rx="4" stroke="' + (Z.mach ? hi : off) + '" stroke-width="3"'));
      out.push(g("translate(" + r1(x + sw / 2) + " 48)", '<g' + (Z.mach ? A("spin", 0, ' data-dur="4000"') : "") + '><circle r="15" fill="' + (Z.mach ? C.navy : off) + '"/><circle r="15" fill="none" stroke="' + (Z.mach ? C.navy : off) + '" stroke-width="7" stroke-dasharray="5 5"/><circle r="5" fill="#fff"/></g>'));
      if (Z.mach && showLock) out.push(lock(x + sw - 6, 26));
      // gaine
      out.push(rect(x, 86, sw, 354, Z.vitr ? "#d7e8fd" : "#dbe3ee", ' stroke="' + C.navy + '" stroke-width="3"'));
      if (Z.vitr) out.push('<g' + A("glow", 0) + '><polygon points="' + r1(x + sw * 0.2) + ",86 " + r1(x + sw * 0.42) + ",86 " + r1(x + sw * 0.1) + ",440 " + r1(x) + ",440 " + x + ',400" fill="#fff" opacity=".8"/><rect x="' + r1(x) + '" y="86" width="' + r1(sw) + '" height="354" fill="none" stroke="' + C.blue2 + '" stroke-width="4"/></g>');
      // paliers / portes palières
      levels.forEach(function (ly, li) {
        out.push(rect(x - 6, ly, sw + 12, 4, C.navy2));
        var dwid = Math.max(14, sw * 0.24);
        out.push(rect(x + sw - dwid - 3, ly - 70, dwid, 70, Z.portes ? C.blue2 : off, Z.portes ? A("light", 0.1 + li * 0.15, ' data-off="' + C.grey + '" data-on="' + C.blue2 + '"') : ""));
        if (Z.portes) out.push(star(x + sw - dwid / 2 - 3, ly - 50, 8, 0.12 + li * 0.15, "#fff"));
      });
      // fosse
      out.push(rect(x, 440, sw, 46, Z.fosse ? "#cfe0f8" : "#e4e9f1", ' stroke="' + (Z.fosse ? hi : off) + '" stroke-width="3"'));
      out.push('<path d="M' + r1(x + 6) + " 480 l18 -18 M" + r1(x + 26) + " 480 l18 -18 M" + r1(x + 46) + ' 480 l18 -18" stroke="' + (Z.fosse ? hi : off) + '" stroke-width="3"' + (Z.fosse ? A("glow", 0.2) : "") + "/>");
      if (Z.fosse && showLock) out.push(lock(x + sw - 14, 462));
      // cabine
      var cw = sw * 0.62, cx = x + sw * 0.08, chh = 86, base = 410 - chh;
      var path = rev ? [[0, 0, -220], [0.15, 0, -220], [0.4, 0, 0], [0.6, 0, 0], [0.85, 0, -220], [1, 0, -220]] : [[0, 0, 0], [0.15, 0, 0], [0.4, 0, -220], [0.6, 0, -220], [0.85, 0, 0], [1, 0, 0]];
      var cab = '<line x1="' + r1(cx + cw / 2) + '" y1="' + (base - 400) + '" x2="' + r1(cx + cw / 2) + '" y2="' + base + '" stroke="' + C.navy + '" stroke-width="2"/>' +
        rect(cx - 3, base - 8, cw + 6, 10, Z.toit ? C.blue : off, ' rx="2"' + (Z.toit ? A("glow", 0.1) : "")) +
        rect(cx, base, cw, chh, C.navy, ' rx="3"') + rect(cx + 6, base + 8, cw - 12, chh - 16, Z.cab ? "#dbe8fb" : "#b9c6da") +
        '<line x1="' + r1(cx + cw / 2) + '" y1="' + (base + 8) + '" x2="' + r1(cx + cw / 2) + '" y2="' + (base + chh - 8) + '" stroke="' + C.navy + '" stroke-width="2"/>';
      if (Z.cab) for (var b = 0; b < 3; b++) cab += '<circle cx="' + r1(cx + cw - 12) + '" cy="' + (base + 24 + b * 16) + '" r="4.5" fill="' + C.blue + '"' + A("light", 0.2 + b * 0.12, ' data-off="#ffffff" data-on="' + C.blue + '"') + "/>";
      if (Z.cab) cab += star(cx + cw * 0.35, base + 30, 10, 0.5);
      if (Z.toit && showLock) cab += lock(cx + cw + 6, base - 14);
      out.push("<g" + (clean ? "" : K(path)) + ">" + cab + "</g>");
    }
    if (cnt > 6) out.push(badge(632, 486, "+" + (cnt - 6) + " appareils"));
    var labels = { cab: "cabine et boutons", portes: "portes et paliers", fosse: "fond de fosse", toit: "toit de cabine", mach: "machinerie", vitr: "vitrages panoramiques" };
    var list = Object.keys(labels).filter(function (k) { return Z[k]; }).map(function (k) { return labels[k]; });
    return {
      T: 6400, svg: out.join(""), label: "Ascenseurs", safety: Z.fosse || Z.toit || Z.mach,
      caption: cnt + " appareil" + (cnt > 1 ? "s" : "") + (list.length ? ", " + list.join(", ") : ", périmètre à cocher")
    };
  }

  /* ---------- célébration (étape résultat) ---------- */
  function finale() {
    var out = ['<rect width="640" height="520" fill="#fff" fill-opacity=".55"' + A("fade", 0) + "/>",
      g("translate(320 236)", '<g' + A("pop", 0.15) + '><circle r="78" fill="' + C.navy + '"/><circle r="78" fill="none" stroke="' + C.blue2 + '" stroke-width="6" opacity=".6"/>' +
        '<path d="M-34 2 L-10 26 L38 -26" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"' + A("draw", 0.45) + "/></g>")];
    [[180, 130, 22, 0.05], [470, 140, 26, 0.2], [150, 360, 18, 0.35], [500, 380, 22, 0.5], [320, 80, 16, 0.65], [400, 450, 14, 0.8], [240, 450, 16, 0.12]].forEach(function (s) { out.push(star(s[0], s[1], s[2], s[3], s[0] > 300 ? C.blue : C.blue2)); });
    return out.join("");
  }

  var SCENES = { "fin-de-chantier": sceneChantier, "hotelier": sceneHotel, "parties-communes": sceneParties, "mobilier-vitrerie": sceneMobilier, "ascenseurs": sceneAsc };

  /* ---------- animations (Web Animations API) ---------- */
  function animate(svg, T) {
    if (reduce || !svg.animate) return;
    svg.querySelectorAll("[data-a]").forEach(function (el) {
      var a = el.getAttribute("data-a"), p = parseFloat(el.getAttribute("data-p") || "0"), kf, opt = { duration: T, iterations: Infinity, easing: "linear" };
      var id0 = "translate(0px,0px) scale(1)", gone = "translate(16px,-14px) scale(0.3)";
      switch (a) {
        case "k":
          kf = el.getAttribute("data-k").split(";").map(function (s) { var q = s.split(":"), xy = q[1].split(","); return { offset: +q[0], transform: "translate(" + xy[0] + "px," + xy[1] + "px)" }; });
          break;
        case "vanish":
          p = Math.min(p, 0.84);
          kf = [{ offset: 0, opacity: 1, transform: id0 }, { offset: p, opacity: 1, transform: id0 }, { offset: p + 0.05, opacity: 0, transform: gone }, { offset: 0.93, opacity: 0, transform: gone }, { offset: 0.985, opacity: 1, transform: id0 }, { offset: 1, opacity: 1, transform: id0 }];
          break;
        case "veil":
          kf = [{ offset: 0, opacity: 1 }, { offset: 0.9, opacity: 1 }, { offset: 0.95, opacity: 0 }, { offset: 0.992, opacity: 0 }, { offset: 1, opacity: 1 }];
          break;
        case "twinkle":
          p = Math.min(p, 0.74);
          kf = [{ offset: 0, opacity: 0, transform: "scale(0) rotate(-45deg)" }, { offset: p, opacity: 0, transform: "scale(0) rotate(-45deg)" }, { offset: p + 0.05, opacity: 1, transform: "scale(1.15) rotate(0deg)" }, { offset: p + 0.12, opacity: 1, transform: "scale(1) rotate(8deg)" }, { offset: p + 0.24, opacity: 0, transform: "scale(0) rotate(30deg)" }, { offset: 1, opacity: 0, transform: "scale(0) rotate(30deg)" }];
          break;
        case "light":
          var on = el.getAttribute("data-on"), off = el.getAttribute("data-off");
          p = Math.min(p, 0.88);
          kf = [{ offset: 0, fill: off }, { offset: p, fill: off }, { offset: p + 0.02, fill: on }, { offset: 0.92, fill: on }, { offset: 0.97, fill: off }, { offset: 1, fill: off }];
          break;
        case "pulse":
          p = Math.min(p, 0.76);
          kf = [{ offset: 0, opacity: 0 }, { offset: p, opacity: 0 }, { offset: p + 0.04, opacity: 1 }, { offset: p + 0.17, opacity: 1 }, { offset: p + 0.21, opacity: 0 }, { offset: 1, opacity: 0 }];
          break;
        case "glow":
          kf = [{ opacity: 0.45 }, { opacity: 1 }]; opt = { duration: 1100, iterations: Infinity, direction: "alternate", easing: "ease-in-out", delay: p * 1000 };
          break;
        case "bob":
          kf = [{ transform: "translateY(0px)" }, { transform: "translateY(-6px)" }]; opt = { duration: 1700, iterations: Infinity, direction: "alternate", easing: "ease-in-out", delay: p * 1000 };
          break;
        case "sway":
          kf = [{ transform: "skewX(0deg)" }, { transform: "skewX(3deg)" }]; opt = { duration: 2400, iterations: Infinity, direction: "alternate", easing: "ease-in-out", delay: p * 1000 };
          break;
        case "spin":
          kf = [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }]; opt = { duration: parseFloat(el.getAttribute("data-dur")) || T, iterations: Infinity };
          break;
        case "pop":
          kf = [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }]; opt = { duration: 520, delay: p * 1000, fill: "both", easing: "cubic-bezier(.3,1.6,.5,1)" };
          break;
        case "fade":
          kf = [{ opacity: 0 }, { opacity: 1 }]; opt = { duration: 400, delay: p * 1000, fill: "both", easing: "ease-out" };
          break;
        case "draw":
          kf = [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }]; opt = { duration: 520, delay: p * 1000, fill: "both", easing: "ease-out" };
          break;
      }
      if (kf) { try { el.animate(kf, opt); } catch (e) {} }
    });
  }

  /* ---------- rendu + transitions ---------- */
  var current = { key: null, sig: null }, timer = null, pending = null;

  function render(st) {
    var service = st && st.service, done = !!(st && st.done), values = (st && st.values) || {};
    var key = service ? service + (done ? ":done" : "") : "idle";
    var sig = JSON.stringify([key, service ? values : null]);
    if (sig === current.sig) return;
    var o = { id: "st" + (++uid), clean: done };
    var sc = service && SCENES[service] ? SCENES[service](values, o) : sceneIdle();
    var markup = '<svg viewBox="0 0 640 520" preserveAspectRatio="xMidYMid slice" focusable="false">' + sc.svg + (done ? finale() : "") + "</svg>";

    var layer = document.createElement("div");
    var slide = key !== current.key;
    layer.className = "stage__layer " + (current.key === null ? "" : slide ? "enter-slide" : "enter-fade");
    layer.innerHTML = markup;
    var old = Array.prototype.slice.call(layers.children);
    layers.appendChild(layer);
    old.forEach(function (l) {
      l.classList.add(slide ? "leave-slide" : "leave");
      setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, reduce ? 0 : 520);
    });
    animate(layer.querySelector("svg"), sc.T || 7000);

    if (hud) {
      hud.querySelector(".stage__label").textContent = done ? sc.label + " : estimation prête" : sc.label;
      hud.querySelector(".stage__caption").textContent = sc.caption || "";
      var safety = hud.querySelector(".stage__safety");
      if (safety) safety.hidden = !sc.safety;
    }
    host.setAttribute("data-scene", key);
    current.key = key; current.sig = sig;
  }

  function update(st) {
    pending = st;
    if (current.key === null) { render(st); return; }
    clearTimeout(timer);
    timer = setTimeout(function () { render(pending); }, 90);
  }

  window.TasciStage = { update: update };
  // État initial (accueil) si le simulateur ne l'a pas encore fourni
  setTimeout(function () { if (current.key === null) render(null); }, 0);
})();
