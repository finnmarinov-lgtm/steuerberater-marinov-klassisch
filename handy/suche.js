// Suche ohne Server: durchsucht das Verzeichnis handy/suche-<sprache>.json und zeigt die Treffer so,
// wie es die Joomla-Suche getan hat (gleicher Aufbau, gleiche Texte, gleiche Textausschnitte).
// Die Angaben in SUCHE (Pfade, Texte je Sprache) schreibt bauen.py in die Seite.
(function () {
  var form = document.getElementById('searchForm');
  if (!form || !window.SUCHE) return;
  var cfg = window.SUCHE;
  var p = new URLSearchParams(location.search);
  var wort = (p.get('searchword') || '').trim().slice(0, 20);
  if (wort === cfg.hinweis) wort = '';
  var art = p.get('searchphrase') || 'all';
  var ordnung = p.get('ordering') || 'newest';
  var limit = p.has('limit') ? parseInt(p.get('limit'), 10) || 0 : 20;
  var start = parseInt(p.get('start'), 10) || 0;
  var bereiche = p.getAll('areas[]');

  // Formular zeigt, wonach gesucht wurde
  form.elements.searchword.value = wort;
  var feld = form.querySelector('input[name="searchphrase"][value="' + art + '"]');
  if (feld) feld.checked = true;
  form.elements.ordering.value = ordnung;
  form.elements.limit.value = String(limit);
  bereiche.forEach(function (b) {
    var k = form.querySelector('input[name="areas[]"][value="' + b + '"]');
    if (k) k.checked = true;
  });
  form.elements.limit.addEventListener('change', function () { form.submit(); });

  if (!wort) return;
  var maskiert = function (t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var woerter = art === 'exact' ? [wort] : wort.split(/\s+/);
  var klein = woerter.map(function (w) { return w.toLowerCase(); });

  // Ausschnitt wie bei Joomla: in Stücken von rund 200 Zeichen vorgehen, das erste Stück mit Treffer zeigen
  function ausschnitt(text, suchwort) {
    var laenge = 200, pos = 0, stueck = '', gefunden = -1;
    while (gefunden < 0 && pos < text.length) {
      var ende = text.indexOf(' ', pos + laenge);
      var groesse = ende >= 0 ? ende - pos : laenge;
      stueck = text.substr(pos, groesse);
      gefunden = stueck.toLowerCase().indexOf(suchwort);
      if (gefunden < 0) pos += groesse + 1;
    }
    if (gefunden >= 0) return (pos > 0 ? '... ' : '') + stueck + ' ...';
    var schnitt = text.indexOf(' ', laenge);
    return schnitt >= 0 ? text.slice(0, schnitt) + ' ...' : text.slice(0, laenge);
  }
  function hervorheben(text) {
    var muster = new RegExp('(' + woerter.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
    return maskiert(text).replace(muster, '<span class="highlight">$1</span>');
  }

  fetch(cfg.verzeichnis).then(function (r) { return r.json(); }).then(function (alle) {
    // „Nur Suchen“: es gibt nur Beiträge – sind ausschließlich andere Bereiche angekreuzt, findet auch Joomla nichts
    var treffer = bereiche.length && bereiche.indexOf('content') < 0 ? [] : alle.filter(function (e) {
      var heu = (e.t + ' ' + e.x).toLowerCase();
      var passt = function (w) { return heu.indexOf(w) >= 0; };
      return art === 'any' ? klein.some(passt) : klein.every(passt);
    });
    var nachTitel = function (a, b) { return a.t.localeCompare(b.t); };
    if (ordnung === 'alpha') treffer.sort(nachTitel);
    else if (ordnung === 'category') treffer.sort(function (a, b) { return a.r.localeCompare(b.r) || nachTitel(a, b); });
    else if (ordnung === 'oldest') treffer.sort(function (a, b) { return a.s < b.s ? -1 : a.s > b.s ? 1 : 0; });
    else if (ordnung === 'newest') treffer.sort(function (a, b) { return a.s > b.s ? -1 : a.s < b.s ? 1 : 0; });

    form.querySelector('.searchintro').innerHTML = '<p><strong>' + cfg.gefunden.replace('%d', treffer.length) + '</strong></p>';
    var seite = limit ? treffer.slice(start, start + limit) : treffer;
    var html = '';
    seite.forEach(function (e, i) {
      var erstes = klein.filter(function (w) { return e.x.toLowerCase().indexOf(w) >= 0; })[0] || klein[0];
      html += '<dt class="result-title">\n\t\t' + (start + i + 1) + '. \t\t\t\t\t<a href="' + cfg.wurzel + encodeURI(e.u) + '">\n\t\t\t\t' + hervorheben(e.t).replace(/<\/?span[^>]*>/g, '') + '\t\t\t</a>\n\t\t\t</dt>\n'
        + (e.r ? '\t\t\t<dd class="result-category">\n\t\t\t<span class="small">\n\t\t\t\t' + maskiert(e.r) + '\n\t\t\t</span>\n\t\t</dd>\n' : '')
        + '\t\t<dd class="result-text">\n\t\t' + hervorheben(ausschnitt(e.x, erstes)) + '\t</dd>\n'
        + (e.d ? '\t\t\t<dd class="result-created">\n\t\t\t' + maskiert(e.d) + '\t\t</dd>\n' : '');
    });
    document.querySelector('.search-results').innerHTML = html;

    // Blätterleiste wie bei Joomla
    var seiten = limit ? Math.ceil(treffer.length / limit) : 1;
    if (seiten < 2) return;
    var aktuell = Math.floor(start / limit) + 1;
    var zu = function (nr) { var q = new URLSearchParams(location.search); q.set('start', (nr - 1) * limit); return '?' + maskiert(q.toString()); };
    var knopf = function (text, nr, aktiv) { return aktiv ? '<a href="' + zu(nr) + '" title="' + text + '">' + text + '</a>' : '<span>' + text + '</span>'; };
    var leiste = '<span>&laquo;</span>' + knopf(cfg.start, 1, aktuell > 1) + knopf(cfg.zurueck, aktuell - 1, aktuell > 1);
    for (var nr = 1; nr <= seiten; nr++) leiste += '<strong>' + knopf(String(nr), nr, nr !== aktuell) + '</strong>';
    leiste += knopf(cfg.weiter, aktuell + 1, aktuell < seiten) + knopf(cfg.ende, seiten, aktuell < seiten) + '<span>&raquo;</span>';
    document.querySelector('.search .pagination').innerHTML = '<div class="pagination">' + leiste + '</div>';
    form.querySelector('.counter').textContent = cfg.zaehler.replace('%a', aktuell).replace('%b', seiten);
  });
})();
