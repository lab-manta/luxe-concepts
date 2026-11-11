/* Search report: charts (AntV G2), map (Leaflet), grids. All figures come from data.js. */
(function () {
  'use strict';
  var R = window.REPORT;
  var C = { ink: '#1d1915', muted: '#655b50', line: '#d9cfc1', soft: '#e7dfd3', brass: '#b5823a', sage: '#5f7257', clay: '#a4523a', card: '#fbf8f3' };
  var FONT = 'Inter, system-ui, sans-serif';
  var nf = new Intl.NumberFormat('en-AU');
  var fmtInt = function (v) { return nf.format(v); };
  var fmtAud = function (v) { return 'A$' + nf.format(v); };
  var narrow = function () { return window.matchMedia('(max-width: 720px)').matches; };
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var TICK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';
  var CROSS = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg>';

  var charts = [];

  /* Horizontal bar chart. rows: [{name, value, luxe}] */
  function bars(id, rows, opt) {
    var box = $(id);
    if (!box) return;
    if (typeof G2 === 'undefined') { box.textContent = 'The chart could not load. The figures are in the table below.'; tableView(box, rows, opt); return; }
    opt = opt || {};
    var fmt = opt.fmt || fmtInt;
    var small = narrow();
    function wrap(s) {
      if (!small || s.length <= 22) return s;
      var mid = Math.floor(s.length / 2), best = -1;
      for (var i = 0; i < s.length; i++) if (s[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
      return best < 0 ? s : s.slice(0, best) + '\n' + s.slice(best + 1);
    }
    var data = rows.map(function (r) { return { name: wrap(r.name), value: r.value, who: r.luxe ? 'Luxe' : 'Others' }; });
    var longest = data.reduce(function (m, d) { return Math.max.apply(null, [m].concat(d.name.split('\n').map(function (p) { return p.length; }))); }, 0);
    var wrapped = data.some(function (d) { return d.name.indexOf('\n') > -1; });
    var labelW = Math.min(small ? 168 : 290, Math.round(longest * (small ? 6.1 : 7.4)) + 16);
    var height = Math.max(150, data.length * (small ? (wrapped ? 40 : 30) : 32) + 28);
    box.style.height = height + 'px';
    box.innerHTML = '';
    var chart = new G2.Chart({ container: box, autoFit: true, height: height });
    chart.options({
      type: 'interval',
      data: data,
      encode: { x: 'name', y: 'value', color: 'who' },
      coordinate: { transform: [{ type: 'transpose' }] },
      scale: {
        x: { padding: 0.32 },
        y: { nice: true, domainMin: 0 },
        color: { domain: ['Luxe', 'Others'], range: [C.brass, C.sage] }
      },
      axis: {
        x: { title: false, tick: false, line: false, labelFill: C.ink, labelFillOpacity: 1, labelOpacity: 1, labelFontSize: small ? 11.5 : 13, labelFontFamily: FONT, labelSpacing: 8,
             labelFontWeight: function (d) { return String(d).indexOf('Luxe') === 0 ? 700 : 400; } },
        y: { title: false, tick: false, line: false, grid: true, gridStroke: C.line, gridStrokeOpacity: 1, gridLineDash: [0, 0], gridLineWidth: 1,
             labelFill: C.muted, labelFillOpacity: 1, labelOpacity: 1, labelFontSize: 11.5, labelFontFamily: FONT, tickCount: small ? 3 : 5,
             labelFormatter: function (v) { return opt.axisFmt ? opt.axisFmt(v) : fmtInt(v); } }
      },
      labels: [{ text: function (d) { return fmt(d.value); }, position: 'right', dx: 6, fill: C.ink, fontSize: small ? 11.5 : 12.5, fontFamily: FONT, fontWeight: 600, textAlign: 'start' }],
      style: { radiusTopLeft: 4, radiusTopRight: 4, maxWidth: 22 },
      legend: false,
      paddingLeft: labelW,
      paddingRight: opt.padRight || 58,
      paddingTop: 6,
      paddingBottom: 26,
      tooltip: { title: 'name', items: [{ field: 'value', name: opt.unit || 'Value', valueFormatter: fmt }] },
      interaction: { elementHighlight: { background: false } },
      state: { inactive: { opacity: 0.55 } },
      animate: false
    });
    chart.render();
    charts.push(chart);
    tableView(box, rows, opt);
  }

  function tableView(box, rows, opt) {
    var next = box.nextElementSibling;
    if (next && next.classList.contains('tv')) next.remove();
    var d = el('details', 'tv');
    d.appendChild(el('summary', null, 'Show these figures as a table'));
    var t = el('table');
    rows.forEach(function (r) {
      var tr = el('tr'); tr.appendChild(el('th', null, r.name)); tr.appendChild(el('td', null, (opt.fmt || fmtInt)(r.value))); t.appendChild(tr);
    });
    d.appendChild(t);
    box.insertAdjacentElement('afterend', d);
  }

  function drawCharts() {
    charts.forEach(function (c) { try { c.destroy(); } catch (e) {} });
    charts = [];
    var mk = R.market_keywords_chart.rows;
    bars('chart-searches', mk.map(function (r) { return { name: r.keyword, value: r.searches }; }), { unit: 'Searches a month' });
    bars('chart-cpc', mk.map(function (r) { return { name: r.keyword, value: r.cpc }; }), { fmt: fmtAud, unit: 'Cost per click (estimate)', axisFmt: function (v) { return 'A$' + v; }, padRight: 52 });
    bars('chart-links', R.rank_linking_sites.rows, { unit: 'Linking sites' });
    bars('chart-kws', R.rank_ranked_keywords.rows, { unit: 'Searches' });
    bars('chart-mapwin', R.map_top3_winners.rows, { unit: 'Checks in the top ' + R.defs.top3, padRight: 40 });
    bars('chart-ai', R.ai_mentions.rows, { unit: 'Answers naming them', padRight: 40 });
    bars('chart-ads', R.ads_rivals.rows.map(function (r) { return { name: r.name, value: r.ads, luxe: r.luxe }; }), { unit: 'Ads found', padRight: 40 });
    bars('chart-budget', R.budget_scenarios.rows.map(function (r) { return { name: r.label, value: r.clicks, luxe: true }; }), { unit: 'Clicks a month' });
  }

  /* Top 10 matrix */
  function drawMatrix() {
    var m = R.rank_matrix, wrap = $('matrix'), key = $('matrix-key');
    var t = el('table', 'matrix');
    var cap = el('caption', null, 'Which sites are in the top ' + R.defs.top10 + ' for each search'); cap.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';
    t.appendChild(cap);
    var thead = el('thead'), hr = el('tr');
    hr.appendChild(el('th'));
    m.searches.forEach(function (s, i) { var th = el('th', null, String(i + 1)); th.title = s.keyword; th.scope = 'col'; hr.appendChild(th); });
    var tt = el('th', null, 'Total'); tt.scope = 'col'; hr.appendChild(tt);
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el('tbody');
    m.rows.forEach(function (r) {
      var tr = el('tr', r.luxe ? 'luxe' : null);
      var th = el('th', null, r.site); th.scope = 'row'; tr.appendChild(th);
      r.cells.forEach(function (c, i) {
        var td = el('td'); var dot = el('span', 'dot' + (c ? ' on' : ''));
        var label = r.site + (c ? ': in the top ' : ': not in the top ') + R.defs.top10 + ' for ' + m.searches[i].keyword;
        dot.title = label; dot.setAttribute('role', 'img'); dot.setAttribute('aria-label', label);
        td.appendChild(dot); tr.appendChild(td);
      });
      tr.appendChild(el('td', 'tot', String(r.total)));
      tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t);
    m.searches.forEach(function (s, i) {
      var li = el('li'); li.appendChild(el('b', null, String(i + 1)));
      var sp = el('span', null, s.keyword + ' '); sp.appendChild(el('i', null, fmtInt(s.searches) + ' a month')); li.appendChild(sp); key.appendChild(li);
    });
  }

  /* Map */
  function drawMap() {
    var g = R.map_grid, card = $('mapcard'), box = $('mapview');
    var current = 0, selected = 'Sutherland', markers = {};
    function rowsFor(k) { return g.rows.filter(function (r) { return r.keyword === g.keywords[k]; }); }
    function cls(r) { return r.luxe_rank == null ? 'none' : (r.luxe_rank <= R.defs.top3 ? 'top' : 'mid'); }
    function statusText(r) { return r.luxe_rank == null ? 'Luxe not found in the results Google returned (up to ' + R.defs.depth + ')' : 'Luxe is number ' + r.luxe_rank; }
    function showCard(r) {
      card.innerHTML = '';
      card.appendChild(el('h4', null, r.point));
      card.appendChild(el('p', 'kw', 'Search: "' + r.keyword + '"'));
      var st = el('p', 'status'); var pin = el('span', 'pin pin-' + cls(r)); st.appendChild(pin); st.appendChild(document.createTextNode(statusText(r))); card.appendChild(st);
      var t3 = el('div', 'top3'); t3.appendChild(el('p', null, 'Top ' + R.defs.top3 + ' on the map here'));
      var ol = el('ol'); r.top3.forEach(function (n) { ol.appendChild(el('li', null, n)); }); t3.appendChild(ol); card.appendChild(t3);
      card.appendChild(el('p', 'hint', 'Tap any dot on the map to see that suburb.'));
    }
    function select(point) {
      selected = point;
      var r = rowsFor(current).filter(function (x) { return x.point === point; })[0];
      Object.keys(markers).forEach(function (p) { var e = markers[p].getElement(); if (e) e.firstChild.classList.toggle('sel', p === point); });
      if (r) showCard(r);
    }
    if (typeof L === 'undefined') {
      box.textContent = 'The map could not load. Use the list to see each suburb.';
      box.style.cssText = 'height:auto;padding:16px';
    }
    var map = null, layer = null;
    if (typeof L !== 'undefined') {
      map = L.map(box, { scrollWheelZoom: false, dragging: !L.Browser.mobile, zoomSnap: 0.25, attributionControl: true });
      map.attributionControl.setPrefix(false);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 15, minZoom: 9,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      layer = L.layerGroup().addTo(map);
      var pts = rowsFor(0).map(function (r) { return [r.lat, r.lng]; });
      map.fitBounds(pts, { padding: [34, 34] });
      window.addEventListener('resize', function () { map.invalidateSize(); });
    }
    function draw() {
      if (!map) { select(selected); return; }
      layer.clearLayers(); markers = {};
      rowsFor(current).forEach(function (r) {
        var c = cls(r);
        var icon = L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 15], html: '<span class="mk ' + c + '">' + (r.luxe_rank == null ? CROSS : r.luxe_rank) + '</span>' });
        var m = L.marker([r.lat, r.lng], { icon: icon, keyboard: true, title: '', alt: r.point + ': ' + statusText(r), riseOnHover: true });
        m.bindTooltip(r.point, { direction: 'top', offset: [0, -14], className: 'tt' });
        m.on('click', function () { select(r.point); });
        m.on('mouseover', function () { select(r.point); });
        m.on('keypress', function (e) { if (e.originalEvent && (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ')) select(r.point); });
        m.addTo(layer); markers[r.point] = m;
        var e = m.getElement(); if (e) { e.setAttribute('role', 'button'); e.setAttribute('aria-label', r.point + ': ' + statusText(r)); e.addEventListener('focus', function () { select(r.point); }); }
      });
      select(selected);
    }
    Array.prototype.forEach.call(document.querySelectorAll('.tg'), function (b) {
      b.addEventListener('click', function () {
        current = Number(b.dataset.kw);
        Array.prototype.forEach.call(document.querySelectorAll('.tg'), function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        draw();
      });
    });
    draw();
  }

  /* AI grid */
  function drawAI() {
    var a = R.ai_grid, grid = $('aigrid'), detail = $('aidetail');
    grid.appendChild(el('div', 'eh'));
    a.engines.forEach(function (e) { grid.appendChild(el('div', 'eh', e)); });
    var shortEng = { 'Google AI Mode': 'AI Mode', 'Google AI Overview': 'Overview' };
    function show(btn, row, c) {
      Array.prototype.forEach.call(grid.querySelectorAll('.c.sel'), function (x) { x.classList.remove('sel'); });
      btn.classList.add('sel');
      detail.innerHTML = '';
      var b = el('b', null, c.engine + ', "' + row.prompt + '" ');
      detail.appendChild(b);
      var txt = c.state === 'none' ? 'Google did not show an AI Overview for this question.'
        : (c.state === 'luxe' ? 'Luxe was named. ' : 'Luxe was not named. ') + (c.named.length ? 'Also named: ' + c.named.join(', ') + '.' : '');
      if (c.state === 'rivals') txt = 'Luxe was not named. ' + (c.named.length ? 'Named: ' + c.named.join(', ') + '.' : 'No business was named.');
      detail.appendChild(document.createTextNode(txt));
    }
    a.rows.forEach(function (row) {
      grid.appendChild(el('div', 'q', row.prompt));
      row.cells.forEach(function (c) {
        var b = el('button', 'c ' + c.state); b.type = 'button';
        var word = c.state === 'luxe' ? 'Luxe named' : (c.state === 'rivals' ? 'Only rivals named' : 'No AI answer shown');
        b.setAttribute('aria-label', c.engine + ': ' + word);
        b.innerHTML = c.state === 'luxe' ? TICK : (c.state === 'none' ? '' : '');
        var lbl = el('span', 'lbl', shortEng[c.engine] || c.engine); b.appendChild(lbl);
        b.addEventListener('click', function () { show(b, row, c); });
        b.addEventListener('mouseenter', function () { show(b, row, c); });
        b.addEventListener('focus', function () { show(b, row, c); });
        grid.appendChild(b);
      });
    });
    var list = $('missed-list');
    R.ai_missed.rows.forEach(function (m) {
      var li = el('li'); li.appendChild(el('p', 'mq', m.prompt));
      var p = el('p', 'mn', 'AI named: ');
      m.named.forEach(function (x, i) {
        p.appendChild(el('b', null, x.name));
        p.appendChild(document.createTextNode(' (' + x.answers + (x.answers === 1 ? ' answer)' : ' answers)') + (i < m.named.length - 1 ? ', ' : '')));
      });
      li.appendChild(p); list.appendChild(li);
    });
  }

  /* Ads table */
  function drawAds() {
    var tb = document.querySelector('#ads-table tbody');
    R.ads_rivals.rows.forEach(function (r) {
      var tr = el('tr', r.luxe ? 'luxe' : null);
      var th = el('th', null, r.name); th.scope = 'row'; tr.appendChild(th);
      if (r.ads === 0) {
        var td = el('td', 'dim', 'None found. Not proof of none.'); td.colSpan = 3; tr.appendChild(td);
      } else {
        tr.appendChild(el('td', 'num', fmtInt(r.ads)));
        tr.appendChild(el('td', 'num', fmtInt(r.ads_30d)));
        tr.appendChild(el('td', null, r.first_seen || ''));
      }
      var sp = el('td', 'num');
      if (r.semrush_12m_aud > 0) sp.textContent = 'about ' + fmtAud(r.semrush_12m_aud);
      else { sp.textContent = 'None shown by Semrush'; sp.classList.add('dim'); }
      tr.appendChild(sp);
      tb.appendChild(tr);
    });
  }

  /* Nav highlight */
  function nav() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.topnav .links a'));
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('main section[id]'), function (s) { io.observe(s); });
  }

  function start() {
    drawMatrix(); drawMap(); drawAI(); drawAds(); nav(); drawCharts();
    var lastNarrow = narrow(), timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (narrow() !== lastNarrow) { lastNarrow = narrow(); drawCharts(); } }, 200);
    });
  }
  var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  var done = false;
  function go() { if (done) return; done = true; start(); }
  ready.then(go);
  setTimeout(go, 1500);
})();
