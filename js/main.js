/* ==========================================================================
   VASTU Architecture Design Studio — interactions
   Plain JS, no dependencies. Everything degrades without it.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.VASTU_CONFIG || {};
  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = Boolean(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- Year */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------- Header state */
  var header = $("#site-header");
  var hero = $(".hero");

  function updateHeader() {
    if (!header) return;
    var solidAt = hero ? Math.max(hero.offsetHeight - header.offsetHeight - 40, 60) : 60;
    header.classList.toggle("is-solid", window.scrollY > solidAt);
  }

  /* ---------------------------------------------- Mobile navigation menu */
  var menuToggle = $("#menu-toggle");
  var nav = $("#primary-nav");
  var scrim = $("#nav-scrim");

  function setMenu(open) {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
    if (header) header.classList.toggle("is-menu-open", open);
    if (scrim) {
      if (open) {
        scrim.hidden = false;
        requestAnimationFrame(function () { scrim.classList.add("is-open"); });
      } else {
        scrim.classList.remove("is-open");
        window.setTimeout(function () { scrim.hidden = true; }, 400);
      }
    }
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });
    if (scrim) scrim.addEventListener("click", function () { setMenu(false); });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && nav.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ------------------------------------------------------ Scroll reveals */
  var revealEls = $$(".reveal");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------ Sticky-header offset */
  function scrollToTarget(target) {
    if (!target) return;
    var headerH = header ? header.offsetHeight : 0;
    var top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
  }

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href) return;
      if (href === "#" || link.hasAttribute("data-whatsapp-quote")) {
        e.preventDefault();
        return;
      }
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
      if (history.replaceState) history.replaceState(null, "", href);
    });
  });

  /* -------------------------------------------------- Active nav section */
  var navLinks = $$(".nav-link");
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      return { link: link, el: document.getElementById(id) };
    })
    .filter(function (item) { return item.el; });

  if (sections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var match = sections.filter(function (s) { return s.el === entry.target; })[0];
        if (!match) return;
        navLinks.forEach(function (l) { l.classList.remove("is-active"); });
        match.link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach(function (s) { sectionObserver.observe(s.el); });
  }

  /* ------------------------------------------------------------ WhatsApp */
  /* wa.me expects digits only and breaks on very long URLs, so the message
     is kept comfortably inside the practical limit. */
  var WA_BASE = "https://wa.me/";

  /* Primary studio number receives every WhatsApp enquiry. */
  function waNumber() {
    var list = CONFIG.phones || [];
    return list.length ? list[0].whatsapp : "";
  }

  function waLink(message) {
    return WA_BASE + waNumber() + "?text=" + encodeURIComponent(message);
  }

  var genericMessage = function () {
    return (CONFIG.whatsappIntro || "Hello, I would like to discuss a project.") +
      "\n\n(Enquiry from the website)";
  };

  $$("[data-whatsapp-quote]").forEach(function (el) {
    el.setAttribute("href", waLink(genericMessage()));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ------------------------------------------------ Consultation form */
  var form = $("#consultation-form");
  var statusEl = $("#form-status");
  var waFallback = $("#wa-fallback");
  var waPreview = $("#wa-preview");
  var waSendGroup = $("#wa-send-group");
  var waCopy = $("#wa-copy");
  var successPanel = $("#success-panel");
  var successCopy = $("#success-copy");
  var submitBtn = $("#submit-btn");

  var FIELDS = [
    { id: "fullName", label: "Full Name", required: true, type: "text" },
    { id: "mobile", label: "Mobile Number", required: true, type: "phone" },
    { id: "email", label: "Email Address", required: false, type: "email" },
    { id: "service", label: "Select Service", required: true, type: "select" },
    { id: "propertyType", label: "Property Type", required: true, type: "select" },
    { id: "location", label: "Project Location", required: true, type: "text" },
    { id: "budget", label: "Approximate Budget", required: false, type: "text" },
    { id: "date", label: "Preferred Consultation Date", required: true, type: "date" },
    { id: "description", label: "Project Description", required: true, type: "text" }
  ];

  function fieldEl(id) { return document.getElementById(id); }

  function setError(field, message) {
    var input = fieldEl(field.id);
    if (!input) return;
    var wrap = input.closest(".field");
    var errorEl = document.getElementById(field.id + "-error");
    if (errorEl) {
      errorEl.textContent = message || "";
      errorEl.classList.toggle("is-visible", Boolean(message));
    }
    if (wrap) wrap.classList.toggle("has-error", Boolean(message));
    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  var dateInput = fieldEl("date");
  if (dateInput) dateInput.min = todayISO();

  function validateField(field) {
    var input = fieldEl(field.id);
    if (!input) return true;
    var value = (input.value || "").trim();

    if (field.required && !value) {
      setError(field, field.label + " is required.");
      return false;
    }
    if (!value) { setError(field, ""); return true; }

    if (field.type === "phone") {
      var digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) {
        setError(field, "Enter a valid mobile number (at least 10 digits).");
        return false;
      }
    }

    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(field, "Enter a valid email address, or leave it blank.");
      return false;
    }

    if (field.type === "date") {
      var chosen = new Date(value + "T00:00:00");
      var today = new Date(todayISO() + "T00:00:00");
      if (isNaN(chosen.getTime())) {
        setError(field, "Choose a valid date.");
        return false;
      }
      if (chosen < today) {
        setError(field, "Please choose today or a future date.");
        return false;
      }
    }

    if (field.id === "description" && value.length < 10) {
      setError(field, "A sentence or two helps us prepare — at least 10 characters.");
      return false;
    }

    setError(field, "");
    return true;
  }

  FIELDS.forEach(function (field) {
    var input = fieldEl(field.id);
    if (!input) return;
    input.addEventListener("blur", function () { validateField(field); });
    input.addEventListener("input", function () {
      if (input.closest(".field") && input.closest(".field").classList.contains("has-error")) {
        validateField(field);
      }
    });
    input.addEventListener("change", function () { validateField(field); });
  });

  function collectData() {
    var data = {};
    FIELDS.forEach(function (field) {
      var input = fieldEl(field.id);
      data[field.id] = input ? (input.value || "").trim() : "";
    });
    return data;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  /* Plain, readable message — no markdown, works on every WhatsApp client. */
  function buildMessage(data) {
    var lines = [
      "New consultation request — VASTU Architecture Design Studio",
      "",
      "Name: " + data.fullName,
      "Mobile: " + data.mobile
    ];
    if (data.email) lines.push("Email: " + data.email);
    lines.push("Service: " + data.service);
    lines.push("Property type: " + data.propertyType);
    lines.push("Project location: " + data.location);
    if (data.budget) lines.push("Approximate budget: " + data.budget);
    lines.push("Preferred date: " + formatDate(data.date));
    lines.push("");
    lines.push("Project description:");
    lines.push(data.description);
    return lines.join("\n");
  }

  function showStatus(message) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
  }

  function showWaFallback(message, data) {
    if (!waFallback || !waPreview) return;
    waPreview.textContent = message;
    waFallback.hidden = false;

    // Turn the copy button's sibling slot into the live send link, so the
    // action is only ever presented once a real message exists.
    var existing = document.getElementById("wa-send");
    if (existing) existing.parentNode.removeChild(existing);

    var send = document.createElement("a");
    send.className = "btn btn--dark";
    send.id = "wa-send";
    send.textContent = "Send on WhatsApp";
    send.href = waLink(message);
    send.target = "_blank";
    send.rel = "noopener";
    if (waSendGroup) waSendGroup.insertBefore(send, waSendGroup.firstChild);

    waFallback.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    if (send) send.focus({ preventScroll: true });
    if (data) showStatus("");
  }

  function showSuccess(copy) {
    if (!successPanel) return;
    if (successCopy && copy) successCopy.textContent = copy;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showStatus("");

      var invalid = [];
      FIELDS.forEach(function (field) {
        if (!validateField(field)) invalid.push(field);
      });

      if (invalid.length) {
        var first = fieldEl(invalid[0].id);
        if (first) {
          first.focus({ preventScroll: true });
          var headerH = header ? header.offsetHeight : 0;
          var top = first.getBoundingClientRect().top + window.scrollY - headerH - 90;
          window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? "auto" : "smooth" });
        }
        showStatus("Please check the " + invalid.length + " highlighted field" + (invalid.length > 1 ? "s" : "") + " and try again.");
        return;
      }

      var data = collectData();
      var message = buildMessage(data);
      var endpoint = (CONFIG.enquiryEndpoint || "").trim();

      /* No endpoint configured: do not pretend anything was saved. */
      if (!endpoint) {
        if (successPanel) successPanel.hidden = true;
        showWaFallback(message, data);
        return;
      }

      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = "Sending…";

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          mobile: data.mobile,
          email: data.email,
          service: data.service,
          propertyType: data.propertyType,
          location: data.location,
          budget: data.budget,
          preferredDate: data.date,
          description: data.description,
          source: "website.consultation"
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed with status " + res.status);
          return res;
        })
        .then(function () {
          form.reset();
          FIELDS.forEach(function (field) { setError(field, ""); });
          if (waFallback) waFallback.hidden = true;
          showSuccess("Thank you, " + data.fullName.split(" ")[0] + ". Your consultation request has been received — the studio will be in touch shortly.");
          showStatus("");
        })
        .catch(function () {
          if (successPanel) successPanel.hidden = true;
          showWaFallback(message, data);
          showStatus("We could not reach the server. Your details are still in the panel below — send them on WhatsApp instead.");
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

  /* Copy-to-clipboard for the fallback message */
  if (waCopy) {
    waCopy.addEventListener("click", function () {
      var text = waPreview ? waPreview.textContent : "";
      if (!text) return;

      function done() {
        var original = waCopy.textContent;
        waCopy.textContent = "Copied";
        window.setTimeout(function () { waCopy.textContent = original; }, 2200);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallbackCopy);
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (err) { /* no-op */ }
        document.body.removeChild(ta);
      }
    });
  }

  /* ------------------------- Prefill helpers (service CTA / quote button) */
  function prefillAndGo(preset) {
    var serviceSelect = fieldEl("service");
    if (serviceSelect && preset) {
      var match = Array.prototype.slice.call(serviceSelect.options).filter(function (o) {
        return o.textContent.trim().toLowerCase() === preset.toLowerCase();
      })[0];
      if (match) serviceSelect.value = match.value || match.textContent;
    }
    var target = document.getElementById("consultation");
    if (target) scrollToTarget(target);
    window.setTimeout(function () {
      var focusTarget = preset ? fieldEl("fullName") : null;
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    }, reduceMotion ? 60 : 620);
  }

  $$("[data-service]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      prefillAndGo(link.getAttribute("data-service"));
    });
  });

  $$("[data-quote]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      prefillAndGo(null);
    });
  });

  $$('[data-cta="consultation"]').forEach(function (link) {
    // Native anchor scrolling already handles the position; just focus later.
    link.addEventListener("click", function () {
      window.setTimeout(function () {
        var f = fieldEl("fullName");
        if (f) f.focus({ preventScroll: true });
      }, reduceMotion ? 60 : 700);
    });
  });

  /* --------------------------------------------------------- Header loop */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateHeader();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    updateHeader();
  });
  updateHeader();
})();
