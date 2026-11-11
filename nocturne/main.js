(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var work = document.querySelector(".work");
  var pinEl = document.querySelector(".work__pin");
  var viewport = document.querySelector(".work__viewport");
  var track = document.querySelector(".work__track");
  var moon = document.querySelector(".work__moon");

  function setMoon(p) {
    if (moon) moon.style.left = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + "%";
  }

  // Native sideways scroll (phones, reduced motion, or no script library): the moon follows the swipe.
  if (viewport) {
    viewport.addEventListener("scroll", function () {
      var max = viewport.scrollWidth - viewport.clientWidth;
      if (max > 0) setMoon(viewport.scrollLeft / max);
    }, { passive: true });
  }

  // Optional hero film: only loads if the file is present, never on reduced motion or data saver.
  (function heroFilm() {
    var art = document.querySelector(".hero__art");
    if (!art || reduce || !art.hasAttribute("data-film")) return;
    var saver = navigator.connection && navigator.connection.saveData;
    if (saver) return;
    var tall = window.matchMedia("(max-width: 700px)").matches;
    var src = tall ? art.getAttribute("data-film-tall") : art.getAttribute("data-film");
    if (!src) return;
    var v = document.createElement("video");
    v.className = "hero__video";
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.preload = "auto";
    v.addEventListener("playing", function () { v.classList.add("is-on"); }, { once: true });
    v.addEventListener("error", function () { v.remove(); });
    var start = function () {
      v.src = src;
      art.appendChild(v);
      var p = v.play();
      if (p && p.catch) p.catch(function () { v.remove(); });
    };
    // Wait for the page and the opening settle of the still before the film fades in.
    var go = function () { setTimeout(start, 2800); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
  })();

  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  // Smooth wheel scrolling on desktop pointers only. Touch keeps native scrolling.
  mm.add("(min-width: 900px) and (pointer: fine)", function () {
    if (!window.Lenis) return;
    var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    var tick = function (t) { lenis.raf(t * 1000); };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    var onClick = function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { duration: 1.4 });
      history.replaceState(null, "", a.getAttribute("href"));
    };
    document.addEventListener("click", onClick);

    return function () {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  });

  // The work: pinned gallery walk on desktop.
  mm.add("(min-width: 900px)", function () {
    if (!work || !track || !pinEl) return;
    work.classList.add("is-pinned");
    track.querySelectorAll("img").forEach(function (img) { img.loading = "eager"; });

    var distance = function () { return Math.max(0, track.scrollWidth - pinEl.clientWidth); };

    var tween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: pinEl,
        start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { setMoon(self.progress); }
      }
    });

    return function () {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
      gsap.set(track, { clearProps: "transform" });
      work.classList.remove("is-pinned");
      setMoon(0);
    };
  });

  // Hero: the painting drifts back as you leave it.
  gsap.to(".hero__art", {
    yPercent: 9, scale: 1.05, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".stage", {
    yPercent: -8, opacity: 0.25, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true }
  });

  // Closing painting rises into place.
  gsap.fromTo(".close__art", { yPercent: -7, scale: 1.1 }, {
    yPercent: 0, scale: 1, ease: "none",
    scrollTrigger: { trigger: ".close", start: "top bottom", end: "bottom bottom", scrub: true }
  });

  // Process: each moon phase lights as its step arrives.
  gsap.utils.toArray(".steps li").forEach(function (li) {
    gsap.from(li.querySelector(".phase__lit"), {
      opacity: 0.15, duration: 0.9, ease: "power2.out",
      scrollTrigger: { trigger: li, start: "top 72%", toggleActions: "play none none reverse" }
    });
  });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
