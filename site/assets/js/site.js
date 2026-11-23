// ADE website: mobile nav, light/dark toggle, copy buttons and reveal-on-scroll. It calls no other origin.
(function () {
  "use strict";

  var isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

  // --- Mobile nav ---------------------------------------------------------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // --- Light / dark ---------------------------------------------------------
  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var root = document.documentElement;
      var current = root.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("ade-site-theme", next); } catch (e) { /* private mode */ }
    });
  }

  // --- Shortcuts: macOS keys or Linux keys --------------------------
  var KEY = "ade-site-platform";
  function readPlatform() {
    try { return localStorage.getItem(KEY) || (isMac ? "mac" : "other"); } catch (e) { return isMac ? "mac" : "other"; }
  }
  function setPlatform(p) {
    try { localStorage.setItem(KEY, p); } catch (e) { /* private mode */ }
    document.querySelectorAll("kbd.key").forEach(function (k) {
      k.textContent = k.getAttribute(p === "mac" ? "data-mac" : "data-other");
    });
    document.querySelectorAll("[data-platform]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-platform") === p ? "true" : "false");
    });
    document.querySelectorAll("[data-only]").forEach(function (el) {
      el.hidden = el.getAttribute("data-only") !== p;
    });
  }
  document.querySelectorAll("[data-platform]").forEach(function (b) {
    b.addEventListener("click", function () { setPlatform(b.getAttribute("data-platform")); });
  });
  setPlatform(readPlatform());

  // --- Copy buttons on code blocks ------------------------------------------
  document.querySelectorAll(".copy").forEach(function (box) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var text = box.querySelector("pre").innerText.trim();
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      });
    });
    box.appendChild(btn);
  });

  // --- Reveal on scroll --------------------------------------------------------
  // Content is fully visible without JS. Only when IntersectionObserver exists
  // and the visitor hasn't asked for reduced motion do below-the-fold blocks
  // start hidden and fade/slide up as they enter the viewport.
  (function () {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    var sel = [
      ".section-head", ".feat-card", ".orx-card", ".hl", ".new-strip", ".price-card", ".training", ".faq", ".cta-band",
      // The composition section joins the same mechanism rather than adding a
      // second one, so reduced-motion and the no-JS fallback keep holding.
      ".compose", ".flow li", ".org-node", ".org-tier", ".role-card", ".svc"
    ].join(",");
    var els = Array.prototype.slice.call(document.querySelectorAll(sel));
    if (!els.length) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) {
      // Anything already on screen stays put, so nothing flashes on load.
      if (el.getBoundingClientRect().top < vh) return;
      // Stagger siblings in a grid slightly.
      var i = 0, n = el;
      while ((n = n.previousElementSibling) && i < 6) if (n.matches(sel)) i++;
      if (i) el.style.setProperty("--reveal-delay", (i * 0.06).toFixed(2) + "s");
      el.classList.add("reveal");
      io.observe(el);
    });
    document.documentElement.classList.add("reveal-on");
  })();
})();

  // Copy buttons: data-copy names the id of the element whose text is copied.
    (function () {
      if (!navigator.clipboard) return;
      document.querySelectorAll("[data-copy]").forEach(function (btn) {
        var src = document.getElementById(btn.getAttribute("data-copy"));
        if (!src) return;
        btn.addEventListener("click", function () {
          navigator.clipboard.writeText(src.textContent.trim()).then(function () {
            var was = btn.textContent;
            btn.textContent = "Copied";
            setTimeout(function () { btn.textContent = was; }, 1600);
          });
        });
      });
    })();
