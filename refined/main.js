(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(orientation: portrait)');

  const header = $('#header');
  const hero = $('.hero');
  const heroStage = $('.hero-stage');
  const video = $('.hero-video');
  const poster = $('.hero-poster');
  const heroCopy = $('.hero-copy');
  const heroShade = $('.hero-shade');
  const heroEnd = $('.hero-end');
  const heroBar = $('.hero-progress span');
  const work = $('#work');
  const tabs = $$('[role="tab"]', work);
  const panels = $$('.work-panel', work);
  const closing = $('#consult');
  const mobileBar = $('.mobile-cta');
  const gallery = $('#gallery-dialog');

  /* ---------- hero: scroll-scrubbed video ---------- */
  let videoReady = false, videoFailed = false, seekFrame = 0, loadTimer = 0;
  let desired = 0, eased = 0;

  function usePoster() {
    videoFailed = true; videoReady = false;
    clearTimeout(loadTimer);
    heroStage.classList.remove('video-ready');
    requestUpdate();
  }
  function scrub() {
    seekFrame = 0;
    if (!videoReady || videoFailed || reduce.matches || video.seeking) return;
    const delta = desired - eased;
    eased = Math.abs(delta) < .02 ? desired : eased + delta * .2;
    if (Math.abs(video.currentTime - eased) > .008) {
      try { video.currentTime = eased; } catch (_) { usePoster(); return; }
    }
    if (Math.abs(desired - eased) > .008) queueSeek();
  }
  function queueSeek() { if (!seekFrame) seekFrame = requestAnimationFrame(scrub); }
  video.addEventListener('seeked', () => { if (Math.abs(desired - eased) > .008) queueSeek(); });
  video.addEventListener('loadeddata', () => {
    if (reduce.matches || videoFailed) return;
    clearTimeout(loadTimer);
    videoReady = true;
    heroStage.classList.add('video-ready');
    requestUpdate();
  });
  video.addEventListener('error', usePoster);
  function setUpVideo() {
    clearTimeout(loadTimer);
    cancelAnimationFrame(seekFrame); seekFrame = 0;
    videoReady = false; videoFailed = false; desired = eased = 0;
    heroStage.classList.remove('video-ready');
    video.pause();
    if (reduce.matches) { video.removeAttribute('src'); return; }
    video.muted = true;
    video.poster = portrait.matches ? 'img/hero-tall-start.jpg' : 'img/hero-wide-start.jpg';
    video.src = portrait.matches ? 'video/hero-tall.mp4' : 'video/hero-wide.mp4';
    video.load();
    loadTimer = setTimeout(usePoster, 25000);
  }

  /* ---------- our work: pinned tabs ---------- */
  let active = 0, manual = false, manualY = 0;
  function selectPanel(index, progress) {
    active = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const amount = i < index ? 1 : on ? (progress === undefined ? 1 : progress) : 0;
      $('.tab-progress span', tab).style.transform = `scaleX(${amount})`;
      panels[i].classList.toggle('is-active', on);
      panels[i].setAttribute('aria-hidden', String(!on));
    });
  }
  function showAllPanels() {
    panels.forEach(p => { p.classList.add('is-active'); p.removeAttribute('aria-hidden'); });
  }
  function goToPanel(index) {
    manual = true;
    if (!reduce.matches) {
      const top = work.getBoundingClientRect().top + scrollY;
      const travel = work.offsetHeight - innerHeight;
      scrollTo({ top: top + travel * ((index + .05) / panels.length), behavior: 'instant' });
    }
    manualY = scrollY;
    selectPanel(index);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => goToPanel(i));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      e.preventDefault();
      goToPanel(next);
      tabs[next].focus();
    });
  });

  /* ---------- one scroll loop ---------- */
  let pending = false;
  function update() {
    pending = false;
    const vh = innerHeight;
    const heroRect = hero.getBoundingClientRect();
    const workRect = work.getBoundingClientRect();
    const closeRect = closing.getBoundingClientRect();

    if (!reduce.matches) {
      const p = clamp(-heroRect.top / Math.max(1, hero.offsetHeight - heroStage.offsetHeight));
      const fade = 1 - clamp(p / .22);
      heroCopy.style.opacity = fade;
      heroCopy.style.transform = `translateY(${-36 * (1 - fade)}px)`;
      heroCopy.style.visibility = fade === 0 ? 'hidden' : 'visible';
      heroCopy.inert = fade === 0;
      heroShade.style.opacity = .35 + .65 * fade;
      const end = clamp((p - .74) / .16);
      heroEnd.style.opacity = end;
      heroEnd.style.transform = `translateY(${18 * (1 - end)}px)`;
      heroBar.style.transform = `scaleX(${p})`;
      /* the still zooms with the scroll, so the effect holds even before the video loads */
      heroStage.style.setProperty('--zoom', (1 + p * .32).toFixed(4));
      if (videoReady && !videoFailed && Number.isFinite(video.duration)) {
        desired = p * (video.duration - .05);
        queueSeek();
      }
      if (manual && Math.abs(scrollY - manualY) > 80) manual = false;
      if (!manual && workRect.top <= 0 && workRect.bottom >= vh) {
        const wp = clamp(-workRect.top / (work.offsetHeight - vh));
        const stage = Math.min(panels.length - .0001, wp * panels.length);
        selectPanel(Math.floor(stage), stage % 1);
      } else if (!manual && workRect.top > 0) selectPanel(0, 0);
    }

    const probe = header.offsetHeight * .5;
    const overDark = [heroRect, workRect].some(r => r.top <= probe && r.bottom > probe)
      || (innerWidth > 980 && closeRect.top <= probe && closeRect.bottom > probe);
    header.classList.toggle('on-dark', overDark);
    if (mobileBar) mobileBar.classList.toggle('is-hidden', closeRect.top < vh * .55 && closeRect.bottom > vh * .4 || gallery.open);
  }
  function requestUpdate() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);

  function applyMotionMode() {
    if (reduce.matches) {
      showAllPanels();
      heroCopy.style.cssText = '';
      heroCopy.inert = false;
      heroShade.style.opacity = '';
    } else selectPanel(active);
    setUpVideo();
    requestUpdate();
  }
  reduce.addEventListener('change', applyMotionMode);
  portrait.addEventListener('change', () => { setUpVideo(); requestUpdate(); });
  applyMotionMode();
  update();

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  /* ---------- review row: duplicate once for a continuous drift ---------- */
  $$('.review-group').forEach(group => {
    if (reduce.matches) return;
    const copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    group.parentElement.append(copy);
  });

  /* ---------- gallery: whole photos, never larger than they can hold ---------- */
  const thumbs = $$('.gallery-thumbs button');
  const galleryImage = $('.gallery-image');
  let galleryIndex = 0, opener;
  const order = [1, 3, 4, 5]; /* thumb index for each work panel */
  function showPhoto(index) {
    galleryIndex = (index + thumbs.length) % thumbs.length;
    const t = thumbs[galleryIndex];
    galleryImage.style.setProperty('--maxw', Math.floor(Number(t.dataset.native) / 1.5) + 'px');
    galleryImage.width = t.dataset.w; galleryImage.height = t.dataset.h;
    galleryImage.src = t.dataset.src;
    galleryImage.alt = t.getAttribute('aria-label');
    $('.gallery-caption').textContent = galleryImage.alt;
    $('.gallery-count').textContent = `${galleryIndex + 1} / ${thumbs.length}`;
    thumbs.forEach((b, i) => b.setAttribute('aria-pressed', String(i === galleryIndex)));
    if (gallery.open) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  $('.gallery-open').addEventListener('click', e => {
    opener = e.currentTarget;
    gallery.showModal();
    document.body.classList.add('modal-open');
    showPhoto(reduce.matches ? 0 : order[active]);
    requestUpdate();
  });
  $('.dialog-close', gallery).addEventListener('click', () => gallery.close());
  gallery.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (opener) opener.focus({ preventScroll: true });
    requestUpdate();
  });
  $('.gallery-prev').addEventListener('click', () => showPhoto(galleryIndex - 1));
  $('.gallery-next').addEventListener('click', () => showPhoto(galleryIndex + 1));
  thumbs.forEach((b, i) => b.addEventListener('click', () => showPhoto(i)));
  gallery.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(galleryIndex + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(galleryIndex - 1); }
  });
})();
