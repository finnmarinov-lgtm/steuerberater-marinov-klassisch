# News-Kasten auffrischen: holt die fünf neuesten Meldungen aus dem Haufe-Feed (wie früher das Joomla-Modul)
# und schreibt sie in alle Seiten. bauen.py benutzt dieselben Funktionen; auf dem Server läuft das Skript täglich
# per GitHub Action (liegt dann in tools/news.py, eine Ebene unter den Seiten).
#
# Stimmt etwas nicht (Feed leer, umgebaut oder seit Wochen ohne neue Meldung), bricht das Skript mit Fehler ab und
# lässt alle Seiten unangetastet – die Action schlägt dann sichtbar fehl und GitHub schickt eine Mail.
import datetime, html, os, re, sys, time, urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

FEED = 'https://www.haufe.de/xml/rss_129148.xml'
ANZAHL = 5            # so viele zeigte die alte Seite
MINDESTENS = 3        # weniger Meldungen im Feed gelten als Fehler
HOECHSTALTER = 30     # Tage: ist die neueste Meldung älter, stimmt mit dem Feed etwas nicht
KASTEN = re.compile(r'<ul class="newsfeed">.*?</ul>', re.S)


class FeedFehler(Exception):
    pass


def hole_meldungen():
    """Liste aus (Adresse, Titel); wirft FeedFehler, wenn der Feed nicht taugt"""
    anfrage = urllib.request.Request(FEED, headers={'User-Agent': 'Mozilla/5.0 (Marinov-Webseite News-Abruf)'})
    fehler = None
    for versuch in range(3):  # kurze Aussetzer überbrücken
        try:
            with urllib.request.urlopen(anfrage, timeout=30) as antwort:
                roh = antwort.read()
            break
        except Exception as e:
            fehler = e
            time.sleep(5 * (versuch + 1))
    else:
        raise FeedFehler(f'Feed nicht erreichbar ({fehler})')
    try:
        wurzel = ET.fromstring(roh)
    except ET.ParseError as e:
        raise FeedFehler(f'Feed ist kein gültiges XML mehr ({e})')
    meldungen, daten = [], []
    for item in wurzel.iter('item'):
        titel = (item.findtext('title') or '').strip()
        link = (item.findtext('link') or '').strip()
        # nur echte Haufe-Meldungen mit sicherer Adresse
        if not titel or urlparse(link).scheme != 'https' or not (urlparse(link).hostname or '').endswith('haufe.de'):
            continue
        try:
            daten.append(parsedate_to_datetime(item.findtext('pubDate')).date())
        except Exception:
            pass
        meldungen.append((link, titel))
    if len(meldungen) < MINDESTENS:
        raise FeedFehler(f'nur {len(meldungen)} brauchbare Meldungen im Feed (Aufbau geändert?)')
    if daten and (datetime.date.today() - max(daten)).days > HOECHSTALTER:
        raise FeedFehler(f'neueste Meldung ist {(datetime.date.today() - max(daten)).days} Tage alt (Feed eingestellt oder umgezogen?)')
    return meldungen[:ANZAHL]


def liste_html(meldungen):
    """genau der Aufbau, den das Joomla-Modul ausgegeben hat"""
    teile = ['<ul class="newsfeed">\n']
    for link, titel in meldungen:
        teile.append('\t\t\t\t\t\t\t<li class="newsfeed-item">\n\t\t\t\t\t\t\t\t\t<h5 class="feed-link">\n'
                     f'\t\t\t\t<a href="{html.escape(link)}" target="_blank">\n\t\t\t\t\t{html.escape(titel, quote=False)}</a>\n'
                     '\t\t\t\t\t</h5>\t\t\t\t\t\t\t\t</li>\n')
    teile.append('\t\t\t\t\t\t\t</ul>')
    return ''.join(teile)


def main():
    try:
        neu = liste_html(hole_meldungen())
    except FeedFehler as e:
        print(f'FEHLER: {e} – die Seiten bleiben unverändert. Feed prüfen: {FEED}')
        sys.exit(1)
    wurzel = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    geaendert = 0
    for ordner, unterordner, dateien in os.walk(wurzel):
        unterordner[:] = [u for u in unterordner if not u.startswith('.')]
        for datei in dateien:
            if not datei.endswith('.html'):
                continue
            pfad = os.path.join(ordner, datei)
            with open(pfad, encoding='utf-8', newline='') as f:
                alt = f.read()
            ersetzt = KASTEN.sub(lambda m: neu, alt)
            if ersetzt != alt:
                with open(pfad, 'w', encoding='utf-8', newline='') as f:
                    f.write(ersetzt)
                geaendert += 1
    print(f'{geaendert} Seiten aufgefrischt' if geaendert else 'keine neuen Meldungen')


if __name__ == '__main__':
    main()
