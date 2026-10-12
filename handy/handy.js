// Kleine Helfer für die klassische Seite.
// Am PC wird davon nur das Zufallsfoto gebraucht – das hat früher der Server ausgesucht.
(function () {
  var FOTOS = [["07-Ott-Parlament-2Kanada_256178 small.jpg", 180, 240], ["10_Der_Tafelberg_in_Kapstadt_207289 small.jpg", 180, 240], ["BigBenDSCF1313_160158 small.jpg", 180, 240], ["Cape_of_Good_Hope_231466 small.jpg", 180, 249], ["DSCN2363001_84646 small.jpg", 180, 240], ["IMG_0460_220263 small.jpg", 180, 240], ["IMG_3067_274145 small.jpg", 180, 270], ["IMG_3494_223897 small.jpg", 180, 270], ["NYSANY0480-2_201722 small.jpg", 180, 240], ["P1040337_243599 small.jpg", 180, 240], ["P1060640a_252908 neu.jpg", 180, 220], ["P4150677_245007 small.jpg", 180, 240], ["Pagode2gr4_248064 small.jpg", 180, 270], ["Paris08_031_253661 neu.jpg", 180, 240], ["Pisa_99404 neu.jpg", 180, 240], ["Sagrada P1200092_111924 neu.jpg", 180, 239], ["freiheitsstatuex9_244812 small.jpg", 180, 240]];   // [Dateiname, Breite, Höhe] – trägt bauen.py ein
  var hier = document.currentScript.src;
  var wurzel = hier.slice(0, hier.lastIndexOf('/handy/') + 1);

  // Reisefoto in der rechten Spalte: bei jedem Seitenaufruf ein anderes, wie bisher
  window.zufallsfoto = function () {
    var stelle = document.currentScript;
    if (!FOTOS.length || !stelle) return;
    var f = FOTOS[Math.floor(Math.random() * FOTOS.length)];
    var bild = document.createElement('img');
    bild.src = wurzel + 'images/random/' + encodeURIComponent(f[0]);
    bild.alt = f[0];
    bild.width = f[1];
    bild.height = f[2];
    stelle.parentNode.insertBefore(bild, stelle);
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Handy-Menü: schließt bei Tipp daneben und mit Esc
    var menue = document.querySelector('.handy-menue');
    if (menue) {
      document.addEventListener('click', function (e) {
        if (menue.open && !menue.contains(e.target)) menue.open = false;
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menue.open) { menue.open = false; menue.querySelector('summary').focus(); }
      });
    }
    // Suchfeld: den Hinweistext („Suche...“) nicht als Suchwort abschicken
    var feld = document.getElementById('mod-search-searchword');
    if (feld && feld.form) {
      feld.form.addEventListener('submit', function () {
        if (feld.value === feld.defaultValue) feld.value = '';
      });
    }
  });
})();
