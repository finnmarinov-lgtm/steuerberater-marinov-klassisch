// Kleine Helfer für die klassische Seite.
// Am PC wird davon nur das Zufallsfoto gebraucht – das hat früher der Server ausgesucht.
(function () {
  var FOTOS = [["Centre-07 - cut and small.jpg", 180, 225], ["Centre-50 - small.jpg", 180, 240], ["DSC00698 - cut and small.jpg", 180, 225], ["DSC04032 - cut and small.jpg", 180, 229], ["DSC05796 - cut ans small.jpg", 180, 206], ["DSCN2363001_84646 small.jpg", 180, 240], ["Fortress - small.jpg", 180, 240], ["IMG_3067_274145 small.jpg", 180, 270], ["NDK-080 - cut and small.jpg", 180, 224], ["P1020740 - small.jpg", 180, 240], ["P1060640a_252908 neu.jpg", 180, 220], ["P1090846 - cut and small_.jpg", 180, 248], ["P1110145 - cut and small.jpg", 180, 231], ["P1110300 - cut and small.jpg", 180, 241], ["alexander_nevsky_night_02 - small.jpg", 180, 240]];   // [Dateiname, Breite, Höhe] – trägt bauen.py ein
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
