/*
 * RB Residences homepage. Renders from window.SITE_DATA (js/data.js).
 * Plain script, no modules or fetches of local files, so the page also opens from disk.
 */
(function () {
  "use strict";

  var D = window.SITE_DATA;
  var doc = document;
  var root = doc.documentElement;
  var splashCtl = window.__splash || { release: function () {} };
  clearTimeout(splashCtl.failsafe);

  /* ------------------------------------------------------------ helpers */
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var get = function (obj, path) { return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  var mq = function (q) { return window.matchMedia(q); };
  var reducedMotion = root.classList.contains("reduced-motion");
  var saveData = root.classList.contains("save-data");
  var NS = "http://www.w3.org/2000/svg";
  var svgEl = function (tag, attrs) {
    var el = doc.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  var icon = function (name, cls) { return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; };

  var euro = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
  var STATUS = { available: "Available", reserved: "Reserved", sold: "Sold" };
  var byId = {};
  (D && D.residences || []).forEach(function (r) { byId[r.id] = r; });
  var levelOf = function (r) { return (D.levels && D.levels[r.floor]) || "Floor " + r.floor; };
  var hrefOf = function (r) { return "residence.html?id=" + encodeURIComponent(r.id); };
  var priceHTML = function (r) {
    return r.status === "sold" ? "Sold" : "<small>From</small> €" + euro.format(r.price) + " <small>+ VAT</small>";
  };
  var priceText = function (r) { return r.status === "sold" ? "sold" : "from €" + euro.format(r.price) + " plus VAT"; };
  var points = function (shape) {
    return shape.trim().split(/\s+/).map(function (p) { return p.split(",").map(Number); });
  };
  var pointsAttr = function (pts) { return pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "); };
  var centroid = function (pts) {
    var a = 0, cx = 0, cy = 0;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length];
      var f = p[0] * q[1] - q[0] * p[1];
      a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f;
    }
    if (Math.abs(a) < 1e-6) return pts[0];
    return [cx / (3 * a), cy / (3 * a)];
  };
  /* Convex hull (monotone chain), used to grow the hit area of a balcony upwards. */
  var hull = function (pts) {
    var p = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var cross = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
    var lower = [], upper = [], i;
    for (i = 0; i < p.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p[i]) <= 0) lower.pop();
      lower.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p[i]) <= 0) upper.pop();
      upper.push(p[i]);
    }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  };

  /* Elements the splash covers: kept out of the tab order while it is up. */
  var pageParts = [$("#site-header"), $("main"), $(".site-footer")];
  var setInert = function (on) { pageParts.forEach(function (el) { if (el) el.inert = on; }); };

  var emergencyRelease = function () {
    splashCtl.release();
    setInert(false);
    root.classList.add("is-ready", "splash-gone");
    var h = $(".hero"); if (h) h.classList.add("is-revealed");
  };

  if (!D) { emergencyRelease(); return; }

  try {
    init();
  } catch (err) {
    console.warn("RB Residences: the page script stopped early.", err);
    emergencyRelease();
  }

  function init() {
    bindData();
    var reveal = initReveal();
    var heroCtl = initHero(reveal);
    initHeader();
    initPicker();
    initCards();
    initForm();
    initScroll(reveal);
    initSplash(heroCtl);
  }

  /* =============================================================== data */
  function bindData() {
    $$("[data-bind]").forEach(function (el) {
      var v = get(D, el.getAttribute("data-bind"));
      if (v != null) el.textContent = v;
    });
    $$("[data-bind-lines]").forEach(function (el) {
      var v = get(D, el.getAttribute("data-bind-lines"));
      if (!Array.isArray(v)) return;
      el.textContent = "";
      v.forEach(function (line, i) {
        if (i) el.appendChild(doc.createElement("br"));
        el.appendChild(doc.createTextNode(line));
      });
    });
    $$("[data-bind-tel]").forEach(function (el) {
      var v = get(D, el.getAttribute("data-bind-tel"));
      if (!v) return;
      el.textContent = v;
      el.href = "tel:" + v.replace(/[^\d+]/g, "");
    });
    $$("[data-bind-mail]").forEach(function (el) {
      var v = get(D, el.getAttribute("data-bind-mail"));
      if (!v) return;
      el.textContent = v;
      el.href = "mailto:" + v;
    });
    var social = $("#social-list");
    if (social && D.contact && D.contact.social) {
      social.innerHTML = D.contact.social.map(function (s) {
        var name = s.label.toLowerCase().replace(/[^a-z]/g, "");
        return '<li><a href="' + esc(s.url) + '" rel="noopener">' + icon(name) + esc(s.label) + "</a></li>";
      }).join("");
    }
    $$(".wordmark[aria-label]").forEach(function (el) { el.setAttribute("aria-label", D.brand.fullName + ", back to top"); });
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ============================================================= splash */
  function initSplash(heroCtl) {
    var splash = $("#splash");
    var fill = $(".splash__fill");
    var pct = $(".splash__pct");
    var photo = $(".reveal__photo");
    var W = { fonts: 15, video: 60, image: 25 };
    var t0 = performance.now();
    var shown = 0;
    var done = false;
    setInert(true);

    var fontsDone = function () { heroCtl.progress.fonts = 1; };
    if (doc.fonts && doc.fonts.load) {
      Promise.all([doc.fonts.load('600 1em "Rosario"'), doc.fonts.load('500 1em "Montserrat"')])
        .then(function () { return doc.fonts.ready; })
        .then(fontsDone, fontsDone);
    } else fontsDone();

    var imageDone = function () { heroCtl.progress.image = 1; };
    if (!photo || (photo.complete && photo.naturalWidth)) imageDone();
    else { photo.addEventListener("load", imageDone, { once: true }); photo.addEventListener("error", imageDone, { once: true }); }

    var real = function () {
      var p = heroCtl.progress;
      return W.fonts * p.fonts + W.video * p.video + W.image * p.image;
    };

    var tick = function (now) {
      var elapsed = now - t0;
      var target = elapsed >= 7000 ? 100 : real(); // never wait longer than 7 s
      shown += (target - shown) * 0.085;
      if (target - shown < 0.25) shown = target;
      var v = Math.round(shown);
      fill.style.transform = "scaleX(" + (shown / 100).toFixed(4) + ")";
      pct.textContent = v + "%";
      splash.setAttribute("aria-valuenow", String(v));
      if (shown >= 100 && elapsed >= 1600) return leave();
      requestAnimationFrame(tick);
    };

    var leave = function () {
      if (done) return;
      done = true;
      heroCtl.beforeReveal();
      splash.classList.add("is-leaving");
      root.classList.add("is-ready");
      splashCtl.release();
      setInert(false);
      var gone = function () { root.classList.add("splash-gone"); };
      splash.addEventListener("transitionend", gone, { once: true });
      setTimeout(gone, 1400);
      heroCtl.afterSplash();
    };

    requestAnimationFrame(tick);
  }

  /* =============================================================== hero */
  function initHero(reveal) {
    var hero = $(".hero");
    var media = $(".hero__media");
    var video = $(".hero__video");
    var useVideo = !!video && !reducedMotion && !saveData;
    var progress = { fonts: 0, video: useVideo ? 0 : 1, image: 0 };
    var splashDone = false;
    var revealed = false;
    var blocked = false;
    var heroVisible = true;
    var seenVisibility = false;
    var textTimer = 0;

    var revealText = function () {
      if (revealed) return;
      revealed = true;
      clearTimeout(textTimer);
      hero.classList.add("is-revealed");
      // the 3D bundle follows 2.5 s after the hero text, unless a scroll asked for it earlier
      setTimeout(reveal.load, 2500);
    };
    var scheduleText = function (ms) {
      if (revealed) return;
      clearTimeout(textTimer);
      textTimer = setTimeout(revealText, ms);
    };

    var onPlayError = function (err) {
      if (err && err.name === "AbortError") return; // interrupted by pause(); not a refusal
      blocked = true;
      progress.video = 1;
      if (splashDone) revealText();
      // iOS Low Power Mode and similar: keep the poster, try again on the first touch or click
      doc.addEventListener("pointerdown", function () {
        blocked = false;
        if (heroVisible) play();
      }, { once: true, passive: true });
    };
    var play = function () {
      var p = video.play();
      if (p && p.catch) p.catch(onPlayError);
    };

    var updateBuffer = function () {
      if (video.readyState >= 3) { progress.video = 1; return; }
      var b = video.buffered;
      if (b.length && video.duration) {
        var f = b.end(b.length - 1) / Math.min(video.duration, 3);
        progress.video = Math.max(progress.video, Math.min(0.95, f));
      }
    };

    if (useVideo) {
      var portrait = mq("(max-aspect-ratio: 1/1)").matches;
      video.muted = true;
      video.defaultMuted = true;
      video.preload = "auto";
      video.src = "assets/video/" + (portrait ? "hero-mobile.mp4" : "hero-desktop.mp4");
      ["progress", "loadeddata", "canplay", "canplaythrough"].forEach(function (t) { video.addEventListener(t, updateBuffer); });
      video.addEventListener("playing", function () {
        progress.video = 1;
        media.classList.add("is-playing");
        if (splashDone && !revealed) scheduleText(1500);
      });
      // iOS only buffers once play() has been called, so start straight away, behind the splash
      play();
    } else if (video) {
      video.remove();
    }

    // pause while the hero is off screen
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (!seenVisibility) {
        seenVisibility = true;
        if (!heroVisible) progress.video = 1; // reload further down: no need to wait for the video
      }
      if (!useVideo) return;
      if (heroVisible) { if (!blocked) play(); }
      else video.pause();
    }).observe(hero);

    return {
      progress: progress,
      beforeReveal: function () {
        if (useVideo) { try { video.currentTime = 0; } catch (e) { /* not seekable yet */ } }
      },
      afterSplash: function () {
        splashDone = true;
        if (reducedMotion || !useVideo || blocked) return revealText();
        if (!video.paused && video.readyState >= 3) scheduleText(1500);
        // fallback if playback never starts
        setTimeout(revealText, 4000);
      },
    };
  }

  /* ============================================================= header */
  function initHeader() {
    var header = $("#site-header");
    var toggle = $(".menu-toggle");
    var nav = $("#site-nav");
    var setMenu = function (open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", function () { setMenu(!header.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    doc.addEventListener("pointerdown", function (e) {
      if (header.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
    });
    var wide = mq("(min-width: 961px)");
    var onWide = function () { if (wide.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  }

  /* ===================================================== building reveal */
  function initReveal() {
    var section = $("#building");
    var stage = $(".reveal__stage");
    var host = $(".reveal__viewer");
    var title = $("#reveal-title");
    var status = $(".reveal__status");
    var V = D.viewer || {};
    var state = "idle"; // idle | loading | ready | failed
    var viewer = null;
    var unlocked = false;
    var orbited = false;
    var isStatic = false;
    var extra = 1;
    var lastStatus = "";

    var setStatus = function (text) {
      if (text === lastStatus) return;
      lastStatus = text;
      status.textContent = text;
    };
    var goStatic = function () {
      isStatic = true;
      section.classList.add("is-static");
      stage.classList.remove("is-unlocked", "is-waiting");
      stage.style.setProperty("--p", "0");
      title.textContent = "The building";
      setStatus("");
    };
    var fail = function (reason) {
      if (state === "failed") return;
      state = "failed";
      console.warn("RB Residences: 3D viewer unavailable (" + reason + "); showing the photograph instead.");
      if (viewer) { try { viewer.dispose(); } catch (e) { /* already gone */ } viewer = null; }
      goStatic();
    };

    var hasWebGL2 = (function () {
      try {
        var c = doc.createElement("canvas");
        var gl = c.getContext("webgl2");
        if (!gl) return false;
        var lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
        return true;
      } catch (e) { return false; }
    })();
    if (!hasWebGL2) goStatic();

    var mount = function () {
      if (!window.BuildingViewer || !window.BuildingViewer.mountViewer) return fail("script");
      try {
        viewer = window.BuildingViewer.mountViewer(host, {
          view: V.view,
          fitMargin: V.fitMargin,
          viewShift: V.viewShift,
          interactive: false,
          wheelZoom: false,
          touchAction: "pan-y",
          onReady: function () { if (state === "loading") { state = "ready"; update(); } },
          onError: function (reason) { fail(reason); },
        });
        viewer.canvas.addEventListener("pointerdown", function () { stage.classList.add("hint-done"); }, { once: true });
      } catch (err) {
        fail(err && err.message ? err.message : "mount");
      }
    };

    var load = function () {
      if (state !== "idle" || isStatic) return;
      state = "loading";
      var s = doc.createElement("script");
      s.src = V.script || "js/viewer.js";
      s.async = true;
      // building the model takes a moment of main-thread time: do it between frames, not mid-scroll
      s.onload = function () {
        if (window.requestIdleCallback) window.requestIdleCallback(mount, { timeout: 1200 });
        else setTimeout(mount, 60);
      };
      s.onerror = function () { fail("script"); };
      doc.head.appendChild(s);
    };

    var measure = function () { extra = Math.max(1, section.offsetHeight - stage.offsetHeight); };

    var unlock = function () {
      unlocked = true;
      stage.classList.add("is-unlocked");
      viewer.setInteractive(true);
      var o = V.orbit || {};
      // portrait: hint and button sit outside the picture band, so a small step back is enough
      var far = mq("(max-aspect-ratio: 1/1)").matches ? o.distancePortrait || 1.12
        : stage.clientHeight < 520 ? o.distanceShortScreen || 1.5 : o.distance || 1.24;
      // first time: a slow turn shows the model is 3D; every time: step back to clear room for the controls
      if (!orbited) { orbited = true; viewer.orbitBy(o.degrees || -24, o.durationMs || 2200, far); }
      else viewer.orbitBy(0, 900, far);
    };
    var lock = function () {
      unlocked = false;
      stage.classList.remove("is-unlocked");
      viewer.setInteractive(false);
      viewer.reset();
    };

    var update = function () {
      if (isStatic) return;
      var top = section.getBoundingClientRect().top;
      var p = clamp(-top / (extra * 0.64), 0, 1);
      var ready = state === "ready";
      var pe = ready ? p : 0;
      stage.style.setProperty("--p", pe.toFixed(4));
      stage.classList.toggle("is-waiting", !ready && p > 0.02);
      setStatus(!ready && p > 0.02 ? "Loading the 3D model…" : "");
      if (!ready) return;
      if (p >= 1 && !unlocked) unlock();
      else if (p < 1 && unlocked) lock();
    };

    measure();
    return { load: load, update: update, measure: measure };
  }

  /* ==================================================== residence picker */
  function initPicker() {
    var svg = $(".picker__svg");
    var card = $("#res-card");
    var stage = $(".picker__stage");
    var frame = $(".picker__frame");
    var leader = $(".picker__leader");
    var line = $(".picker__leader-line");
    var dot = $(".picker__leader-dot");
    var wide = mq("(min-width: 1200px) and (min-aspect-ratio: 8/5), (min-width: 1400px) and (min-aspect-ratio: 3/2)");
    var spots = {};
    var markers = [];
    var selected = null;
    var scale = 1;

    D.residences.forEach(function (r) {
      var pts = points(r.shape);
      // floors above the garden: the hit area also covers the glazing behind the balcony
      var hit = r.floor >= 1 ? hull(pts.concat(pts.map(function (p) { return [p[0], p[1] - 60]; }))) : pts;
      var c = centroid(pts);
      var a = svgEl("a", {
        class: "hotspot hotspot--" + r.status,
        href: hrefOf(r),
        "aria-label": "Residence " + r.id + ", " + levelOf(r) + ", " + r.type + ", " + STATUS[r.status].toLowerCase() + ", " + priceText(r),
        "data-id": r.id,
      });
      a.appendChild(svgEl("polygon", { class: "hotspot__hit", points: pointsAttr(hit) }));
      a.appendChild(svgEl("polygon", { class: "hotspot__shape", points: pointsAttr(pts) }));
      var g = svgEl("g", { class: "hotspot__marker", transform: "translate(" + c[0].toFixed(1) + " " + c[1].toFixed(1) + ")" });
      var ring = svgEl("circle", { class: "hotspot__ring", r: "11", cx: "0", cy: "0" });
      var d = svgEl("circle", { class: "hotspot__dot", r: "4.5", cx: "0", cy: "0" });
      g.appendChild(ring); g.appendChild(d);
      a.appendChild(g);
      svg.appendChild(a);
      spots[r.id] = { el: a, pts: pts };
      markers.push({ ring: ring, dot: d });
    });

    /* card: built once, then updated in place so focus inside it is never lost */
    var fact = function (k, ic, label) {
      return "<div>" + icon(ic) + "<dt>" + label + '</dt><dd data-k="' + k + '"></dd></div>';
    };
    card.innerHTML =
      '<div class="res-card__top"><span class="status" data-k="status"></span><span class="res-card__floor" data-k="floor"></span></div>' +
      '<h3 class="res-card__name" data-k="name"></h3>' +
      '<p class="res-card__type" data-k="type"></p>' +
      '<dl class="facts">' +
      fact("interior", "area", "Interior") + fact("terrace", "terrace", '<span data-k="terraceLabel">Terrace</span>') +
      fact("bedrooms", "bed", "Bedrooms") + fact("bathrooms", "bath", "Bathrooms") +
      fact("orientation", "compass", "Orientation") + fact("view", "view", "View") +
      "</dl>" +
      '<p class="res-card__price" data-k="price"></p>' +
      '<a class="btn btn--gold btn--block" data-k="link" href="#">View residence' + icon("arrow") + "</a>" +
      '<p class="res-card__ask" data-k="askWrap"><a class="text-link" href="#contact" data-k="ask">Ask about this residence</a></p>';
    card.hidden = false;
    var K = {};
    $$("[data-k]", card).forEach(function (el) { K[el.getAttribute("data-k")] = el; });

    var fill = function (r) {
      K.status.className = "status status--" + r.status;
      K.status.textContent = STATUS[r.status];
      K.floor.textContent = levelOf(r);
      K.name.textContent = "Residence " + r.id;
      K.type.textContent = r.type;
      K.interior.textContent = r.interior + " m²";
      K.terraceLabel.textContent = r.floor === 0 ? "Terrace & garden" : "Terrace";
      K.terrace.textContent = r.terrace + " m²";
      K.bedrooms.textContent = String(r.bedrooms);
      K.bathrooms.textContent = String(r.bathrooms);
      K.orientation.textContent = r.orientation;
      K.view.textContent = r.view;
      K.price.innerHTML = priceHTML(r);
      K.link.href = hrefOf(r);
      K.link.setAttribute("aria-label", "View residence " + r.id);
      K.askWrap.hidden = r.status === "sold";
      K.ask.setAttribute("data-ask", r.id);
    };

    var select = function (id, animate) {
      if (!byId[id] || id === selected) return;
      selected = id;
      Object.keys(spots).forEach(function (k) { spots[k].el.classList.toggle("is-selected", k === id); });
      fill(byId[id]);
      drawLeader(animate !== false);
    };

    /* leader line (wide layout): from the selected balcony's left end to the card's right edge */
    var drawLeader = function (animate) {
      if (!wide.matches || !selected) { line.setAttribute("d", ""); dot.style.display = "none"; return; }
      var m = svg.getScreenCTM();
      if (!m) return;
      var pts = spots[selected].pts;
      var xs = pts.map(function (p) { return p[0]; });
      var ys = pts.map(function (p) { return p[1]; });
      var pt = svg.createSVGPoint();
      pt.x = Math.min.apply(null, xs);
      pt.y = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
      var sp = pt.matrixTransform(m);
      var sr = stage.getBoundingClientRect();
      var cr = card.getBoundingClientRect();
      var sx = sp.x - sr.left, sy = sp.y - sr.top;
      var cx = cr.right - sr.left;
      var ty = clamp(sy, cr.top - sr.top + 28, cr.bottom - sr.top - 28);
      var d;
      if (Math.abs(ty - sy) < 0.5) d = "M" + sx.toFixed(1) + "," + sy.toFixed(1) + "H" + cx.toFixed(1);
      else {
        var knee = cx + Math.min(56, Math.max(16, (sx - cx) * 0.4));
        d = "M" + sx.toFixed(1) + "," + sy.toFixed(1) + "H" + knee.toFixed(1) + "L" + cx.toFixed(1) + "," + ty.toFixed(1);
      }
      line.setAttribute("d", d);
      dot.style.display = "";
      dot.setAttribute("cx", sx.toFixed(1));
      dot.setAttribute("cy", sy.toFixed(1));
      if (animate && !reducedMotion) {
        var len = line.getTotalLength();
        line.style.transition = "none";
        line.style.strokeDasharray = len + " " + len;
        line.style.strokeDashoffset = String(len);
        line.getBoundingClientRect();
        line.style.transition = "stroke-dashoffset 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)";
        line.style.strokeDashoffset = "0";
      } else {
        // a redraw (resize, card reflow) keeps any draw-in that is still running
        var l = line.getTotalLength();
        line.style.strokeDasharray = l + " " + l;
      }
    };

    /* keep strokes and markers a constant size on screen */
    var rescale = function () {
      var m = svg.getScreenCTM();
      if (!m || !m.a) return;
      scale = m.a;
      var u = 1 / scale;
      svg.style.setProperty("--u", u.toFixed(5));
      markers.forEach(function (mk) {
        mk.ring.setAttribute("r", (11 * u).toFixed(2));
        mk.dot.setAttribute("r", (4.5 * u).toFixed(2));
      });
      drawLeader(false);
    };
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(rescale);
      ro.observe(frame);
      ro.observe(card);
    }
    window.addEventListener("resize", rescale);
    if (wide.addEventListener) wide.addEventListener("change", rescale);

    /* interaction: hover selects (mouse), focus selects (keyboard), first tap selects / second tap opens (touch) */
    var press = null;
    var spotOf = function (e) { var a = e.target.closest && e.target.closest(".hotspot"); return a && svg.contains(a) ? a : null; };
    svg.addEventListener("pointerover", function (e) {
      var a = spotOf(e);
      if (a && e.pointerType === "mouse") select(a.getAttribute("data-id"));
    });
    svg.addEventListener("pointerdown", function (e) {
      var a = spotOf(e);
      if (!a) return;
      var id = a.getAttribute("data-id");
      // recorded now, because focus (which selects) fires before click
      press = { id: id, type: e.pointerType, wasSelected: id === selected, t: performance.now() };
    });
    svg.addEventListener("focusin", function (e) {
      var a = spotOf(e);
      if (a) select(a.getAttribute("data-id"));
    });
    svg.addEventListener("click", function (e) {
      var a = spotOf(e);
      if (!a) return;
      var id = a.getAttribute("data-id");
      var p = press;
      press = null;
      var touchLike = p && p.id === id && p.type !== "mouse" && performance.now() - p.t < 1500;
      if (touchLike && !p.wasSelected) {
        e.preventDefault();
        select(id);
      }
    });

    /* "Ask about this residence": preselect it in the form */
    card.addEventListener("click", function (e) {
      var ask = e.target.closest("[data-ask]");
      if (!ask) return;
      var sel = $("#f-residence");
      if (sel) sel.value = ask.getAttribute("data-ask");
    });

    select(D.defaultResidence && byId[D.defaultResidence] ? D.defaultResidence : D.residences[0].id, false);
    requestAnimationFrame(rescale);
  }

  /* ===================================================== six residences */
  function initCards() {
    var list = $("#avail-list");
    var photo = $(".reveal__photo");
    if (!list) return;
    var P = D.picture || { width: 1920, height: 1080 };
    var S = 3.1; // background width as a multiple of the card width
    var ky = (S * P.height / P.width) / 0.75; // background height / card height (4:3 card)
    list.innerHTML = (D.featured || []).map(function (id) {
      var r = byId[id];
      if (!r) return "";
      var c = centroid(points(r.shape));
      var px = clamp(((c[0] / P.width) * S - 0.5) / (S - 1), 0, 1) * 100;
      var py = clamp(((c[1] / P.height) * ky - 0.5) / (ky - 1), 0, 1) * 100;
      var slug = r.id.replace(/[^a-z0-9]/gi, "-");
      return '<li class="avail__item"><article class="r-card" aria-labelledby="rc-' + slug + '">' +
        '<div class="r-card__media" style="background-position:' + px.toFixed(1) + "% " + py.toFixed(1) + '%">' +
        '<span class="status status--' + r.status + '">' + STATUS[r.status] + "</span></div>" +
        '<div class="r-card__body">' +
        '<p class="r-card__floor">' + esc(levelOf(r)) + "</p>" +
        '<h3 class="r-card__name" id="rc-' + slug + '">Residence ' + esc(r.id) + "</h3>" +
        '<p class="r-card__type">' + esc(r.type) + "</p>" +
        '<ul class="r-card__facts">' +
        "<li>" + icon("area") + r.interior + " m² interior</li>" +
        "<li>" + icon("terrace") + r.terrace + " m² " + (r.floor === 0 ? "outdoor" : "terrace") + "</li>" +
        "<li>" + icon("bed") + r.bedrooms + (r.bedrooms === 1 ? " bedroom" : " bedrooms") + "</li>" +
        "</ul>" +
        '<p class="r-card__price">' + priceHTML(r) + "</p>" +
        '<a class="text-link r-card__link" href="' + hrefOf(r) + '">View residence<span class="sr-only"> ' + esc(r.id) + "</span></a>" +
        "</div></article></li>";
    }).join("");

    // the crop is the building picture the page has already loaded: no extra download
    var apply = function () {
      var src = photo && (photo.currentSrc || photo.src);
      if (!src) return;
      $$(".r-card__media", list).forEach(function (m) { m.style.backgroundImage = 'url("' + src + '")'; });
    };
    if (photo && photo.currentSrc) apply();
    else if (photo) photo.addEventListener("load", apply, { once: true });
  }

  /* ============================================================== form */
  function initForm() {
    var form = $("#enquiry");
    if (!form) return;
    var done = $("#form-done");
    var status = $("#form-status");
    var submit = $('button[type="submit"]', form);
    var select = $("#f-residence");
    var warned = false;
    var attempted = false;

    D.residences.filter(function (r) { return r.status !== "sold"; }).forEach(function (r) {
      var o = doc.createElement("option");
      o.value = r.id;
      o.textContent = "Residence " + r.id + " · " + r.type + (r.status === "reserved" ? " (reserved)" : "");
      select.appendChild(o);
    });

    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var rules = {
      name: function (el) { return el.value.trim() ? "" : "Please enter your full name."; },
      email: function (el) {
        var v = el.value.trim();
        if (!v) return "Please enter your email address.";
        return EMAIL.test(v) ? "" : "Please enter a valid email address, for example name@example.com.";
      },
      phone: function (el) {
        var v = el.value.trim();
        if (!v) return "";
        var digits = v.replace(/\D/g, "").length;
        return /^\+?[\d\s().\/-]+$/.test(v) && digits >= 6 && digits <= 15 ? "" : "Please enter a valid phone number: digits only, with an optional + at the start.";
      },
      consent: function (el) { return el.checked ? "" : "Please confirm that we may contact you about your enquiry."; },
    };
    var fields = Object.keys(rules).map(function (name) {
      var el = form.elements[name];
      return { name: name, el: el, error: $("#" + el.id + "-error"), dirty: false };
    });

    var show = function (f, msg) {
      f.error.textContent = msg;
      f.error.hidden = !msg;
      if (msg) {
        f.el.setAttribute("aria-invalid", "true");
        f.el.setAttribute("aria-describedby", f.error.id);
      } else {
        f.el.removeAttribute("aria-invalid");
        f.el.removeAttribute("aria-describedby");
      }
    };
    var check = function (f) { var msg = rules[f.name](f.el); show(f, msg); return !msg; };

    fields.forEach(function (f) {
      f.el.addEventListener(f.el.type === "checkbox" ? "change" : "input", function () {
        f.dirty = true;
        if (f.el.getAttribute("aria-invalid") === "true") check(f); // clear the error as soon as it is fixed
      });
      f.el.addEventListener("blur", function () { if (f.dirty || attempted) check(f); });
    });

    var setBusy = function (busy) {
      submit.disabled = busy;
      submit.textContent = busy ? "Sending…" : "Send enquiry";
    };

    var succeed = function (values) {
      var first = values.name.split(/\s+/)[0];
      $("#form-done-title").textContent = "Thank you, " + first + ".";
      $("#form-done-text").textContent = "We have received your enquiry and will reply to " + values.email + " within one working day.";
      form.hidden = true;
      done.hidden = false;
      done.focus();
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      attempted = true;
      status.hidden = true;
      var firstBad = null;
      fields.forEach(function (f) { if (!check(f) && !firstBad) firstBad = f.el; });
      if (firstBad) { firstBad.focus(); return; }

      var values = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        residence: form.elements.residence.value,
        message: form.elements.message.value.trim(),
        consent: true,
        page: location.href.split("#")[0],
        sentAt: new Date().toISOString(),
      };

      if (!D.formEndpoint) {
        if (!warned) {
          warned = true;
          console.warn("RB Residences: formEndpoint is empty in js/data.js, so the enquiry was not sent anywhere.");
        }
        succeed(values);
        return;
      }

      setBusy(true);
      fetch(D.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(values),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          setBusy(false);
          succeed(values);
        })
        .catch(function () {
          setBusy(false);
          status.textContent = "Your enquiry could not be sent. Please check your connection and try again, or email us at " + D.contact.email + ".";
          status.hidden = false;
        });
    });

    $("#form-again").addEventListener("click", function () {
      form.reset();
      attempted = false;
      fields.forEach(function (f) { f.dirty = false; show(f, ""); });
      status.hidden = true;
      done.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
  }

  /* ==================================================== scroll + resize */
  function initScroll(reveal) {
    var header = $("#site-header");
    var links = $$(".site-nav__list a");
    var targets = links.map(function (a) { return doc.querySelector(a.getAttribute("href")); });
    var light = $$('[data-surface="light"]');
    var ticking = false;
    var scrolled = false;
    var current = -1;

    var frame = function () {
      ticking = false;
      reveal.update();

      // the section in view is marked in the navigation
      var probe = window.innerHeight * 0.4;
      var active = -1;
      targets.forEach(function (s, i) {
        if (!s) return;
        var r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) active = i;
      });
      if (active !== current) {
        current = active;
        links.forEach(function (a, i) {
          if (i === active) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      }

      // denser glass while the header is over a light section
      var hr = header.getBoundingClientRect();
      var y = hr.top + hr.height / 2;
      var onLight = light.some(function (s) { var r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
      header.classList.toggle("is-on-light", onLight);
    };

    window.addEventListener("scroll", function () {
      if (!scrolled) { scrolled = true; reveal.load(); }
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    window.addEventListener("resize", function () { reveal.measure(); frame(); });
    frame();
  }
})();
