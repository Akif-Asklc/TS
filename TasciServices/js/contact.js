/* =========================================================
   TASCI Services — formulaire de contact
   Envoi : Web3Forms si CONFIG.web3formsKey est rempli, sinon mailto.
   Option : envoi du même message par WhatsApp.
   ========================================================= */
(function () {
  "use strict";
  var form = document.getElementById("contact-form");
  if (!form || !window.TasciForm) return;
  var err = form.querySelector("[data-contact-error]");
  var status = form.querySelector("[data-send-status]");
  var f = form.elements;

  function summary() {
    var service = f.service.value;
    var price = window.TasciPrice;
    return {
      subject: "Demande de contact" + (service ? " – " + service : "") + (f.city.value.trim() ? " – " + f.city.value.trim() : ""),
      text: [
        "Bonjour,",
        "",
        f.message.value.trim() || "—",
        "",
        "Prestation concernée : " + (service || "non précisée"),
        "Vous êtes : " + (price && price.mode() === "pro" ? "Professionnel" : "Particulier"),
        "",
        "Nom : " + (f.name.value.trim() || "—"),
        "Téléphone : " + (f.phone.value.trim() || "—"),
        "E-mail : " + (f.email.value.trim() || "—"),
        "Ville d’intervention : " + (f.city.value.trim() || "—"),
        "",
        "Envoyé depuis le formulaire de contact du site TASCI Services."
      ].join("\r\n")
    };
  }

  function validate(needContact) {
    [f.name, f.phone, f.email, f.message].forEach(function (el) { el.removeAttribute("aria-invalid"); });
    var problems = [];
    if (needContact && !f.name.value.trim()) { problems.push("votre nom"); f.name.setAttribute("aria-invalid", "true"); }
    var phoneOk = f.phone.value.replace(/\D/g, "").length >= 9;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim());
    if (needContact && !phoneOk && !emailOk) { problems.push("un téléphone ou un e-mail valide"); f.phone.setAttribute("aria-invalid", "true"); f.email.setAttribute("aria-invalid", "true"); }
    if (!f.message.value.trim()) { problems.push("votre message"); f.message.setAttribute("aria-invalid", "true"); }
    if (problems.length) {
      err.textContent = "Pour envoyer votre demande, indiquez " + problems.join(", ").replace(/, ([^,]*)$/, " et $1") + ".";
      err.hidden = false;
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return false;
    }
    err.hidden = true;
    return true;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(true)) return;
    var sm = summary();
    window.TasciForm.send({
      subject: sm.subject, text: sm.text,
      data: { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), city: f.city.value.trim(), service: f.service.value || "non précisée" },
      button: form.querySelector('button[type="submit"]'), status: status, honeypot: f.botcheck,
      onSuccess: function () { f.message.value = ""; }
    });
  });

  var wa = form.querySelector("[data-contact-wa]");
  if (wa) wa.addEventListener("click", function () {
    if (!validate(false)) return; // WhatsApp identifie déjà l'expéditeur : seul le message est requis
    window.TasciForm.openWhatsApp(summary().text);
  });
})();
