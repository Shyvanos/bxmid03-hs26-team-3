# Readme Ortbeton nach NPK | Gruppe 3

[![In Colab öffnen](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Shyvanos/bxmid03-hs26-team-3/blob/main/checks/Team3_Ortbeton_NPK_Starter.ipynb)

Aus dem IFC-Modell entsteht pro NPK-Position eine nachvollziehbare Menge für Ortbetonwände: Beton (m³), Wandschalung (m²), Stirnschalung (m²) und eine Schätzung der Bewehrung (kg). Das Prüfskript [`checks/ortbeton_npk.js`](checks/ortbeton_npk.js) läuft im Browser in [IFClite](https://www.ifclite.com), die Datenanalyse im [Colab-Notebook](https://colab.research.google.com/github/Shyvanos/bxmid03-hs26-team-3/blob/main/checks/Team3_Ortbeton_NPK_Starter.ipynb).

**Inhalt:** [Problem](#problem) · [Zielgruppe](#zielgruppe) · [Was das MVP macht](#was-das-mvp-macht) · [Schritt für Schritt](#schritt-für-schritt-massenauszug-nach-npk) · [Mengenregeln v0.2](#mengenregeln-v02) · [Annahmen](#annahmen) · [Wenn etwas nicht klappt](#wenn-etwas-nicht-klappt) · [Ordner](#ordner) · [Stand](#stand)

## Problem

Heute misst der Kostenplaner die Ortbetonmengen für das LV von Hand aus Plänen aus und ordnet sie selbst NPK-Positionen zu. Die Mengen im IFC-Modell werden nicht genutzt, die Arbeit ist doppelt und fehleranfällig.

## Zielgruppe

**Planer / Kostenplaner (SIA-Phase 41).** Er braucht eine nachvollziehbare Mengenliste der Ortbetonbauteile pro NPK-Position als Grundlage für das LV.

## Was das MVP macht

| | |
|---|---|
| **Input** | IFC-Modell (IFC4) mit Ortbetonwänden (`IfcWall`) |
| **Verarbeitung** | 1. Ortbetonwände auswählen · 2. Volumen `Qto_WallBaseQuantities.NetVolume` lesen · 3. über Material (z. B. Betonsorte) einer NPK-Position zuordnen · 4. pro Wand Status vergeben |
| **Output** | CSV-Tabelle pro Wand: GlobalId, Ist-Wert, Regel, Ergebnis, Grund, NPK-Position · Summe m³ pro NPK-Position |
| **Entscheid des Nutzers** | Kostenplaner prüft Stichproben, plausibilisiert grob die Gesamtkosten und übernimmt die Summen ins LV. Wände mit Status «fehlend» oder «nicht zugeordnet» gehen als Befund an den Modellautor. |

**Was das MVP nicht macht:** kein fertiges LV, keine NPK-Positionstexte (Lizenz CRB), keine Prüfung, ob das Volumen nach NPK-Messregeln korrekt ist (z. B. Öffnungsabzug).

## Schritt für Schritt: Massenauszug nach NPK

Ihr spielt den Weg des Kostenplaners durch: Modell prüfen, Datenlage verstehen, Mengen auswerten, Ergebnis kontrollieren und ins LV übernehmen.

```
1 IDS-Check ──▶ 2 Datenlage ──▶ 3 Mengenauszug v0.2 ──CSV──▶ 4 Kontrolle ──▶ 5 LV und Befunde
  (IFClite)      (Colab)          (IFClite-Skript)            (Excel)          (Kostenplaner)
```

0. [Repository herunterladen und Modell bereitlegen](#schritt-0--repository-herunterladen-und-modell-bereitlegen)
1. [Eingangsprüfung mit IDS](#schritt-1--eingangsprüfung-mit-ids)
2. [Datenlage im Colab-Notebook verstehen](#schritt-2--datenlage-im-colab-notebook-verstehen)
3. [Mengenauszug mit dem IFClite-Skript v0.2](#schritt-3--mengenauszug-mit-dem-ifclite-skript-v02)
4. [Ergebnis kontrollieren](#schritt-4--ergebnis-kontrollieren)
5. [Übernahme ins LV und Befunde melden](#schritt-5--übernahme-ins-lv-und-befunde-melden)

Modell: `Team_3_WaltGalmarini_Arbeitsmodell.ifc` (IFC4, Längen in m, Flächen in m², Volumen in m³). Die erwarteten Zahlen stehen bei jedem Schritt unter **Kontrolle**. Wo **[eintragen]** steht, ergänzt das Team die Werte nach dem ersten Lauf.

### Was ihr braucht

| | Version |
|---|---|
| Laptop mit aktuellem Browser und Internetverbindung | **[eintragen]** |
| [IFClite](https://www.ifclite.com) im Browser (Schritte 1 und 3) | **[eintragen]** |
| Google-Konto für [Colab](https://colab.research.google.com) (Schritt 2) | |
| Python 3.12, IfcOpenShell 0.9.0.post1, pandas (installiert das Notebook in Zelle 1 selbst) | gemäss Notebook |
| Excel oder ein anderes Programm für CSV mit Semikolon (Schritt 4) | |

### Schritt 0 · Repository herunterladen und Modell bereitlegen

1. Oben auf der [Repo-Seite](https://github.com/Shyvanos/bxmid03-hs26-team-3) **Code → Download ZIP** klicken und die ZIP-Datei entpacken. Mit Git geht es auch so:
   ```
   git clone https://github.com/Shyvanos/bxmid03-hs26-team-3.git
   ```
2. Das Arbeitsmodell `Team_3_WaltGalmarini_Arbeitsmodell.ifc` lokal bereitlegen.
   **Obacht:** Das Modell ist geschützt und gehört nicht ins Repository. Die Datei [`.gitignore`](.gitignore) schliesst `*.ifc` aus.
3. Diese drei Dateien braucht ihr in den nächsten Schritten:
   - IDS: [`requirements/ortbeton_p41.ids`](requirements/ortbeton_p41.ids)
   - Notebook: [`checks/Team3_Ortbeton_NPK_Starter.ipynb`](checks/Team3_Ortbeton_NPK_Starter.ipynb)
   - Prüfskript v0.2: [`checks/ortbeton_npk.js`](checks/ortbeton_npk.js)

### Schritt 1 · Eingangsprüfung mit IDS

Liefert das Modell überhaupt die Daten für die Zuordnung? Das IDS [`requirements/ortbeton_p41.ids`](requirements/ortbeton_p41.ids) prüft pro `IfcWall`:

| Anforderung | Regel im IDS |
|---|---|
| Betonsorte im Namen | `Name` passt auf `.*Beton (C[0-9]{2}/[0-9]{2}\|- Bestand).*`, z. B. «Beton C30/37» |
| Betonmaterial | Material passt auf `_Beton_.*` |
| Volumen vorhanden | `Qto_WallBaseQuantities.NetVolume` grösser als 0 m³ |

1. [ifclite.com](https://www.ifclite.com) öffnen und das Arbeitsmodell laden.
2. Das IDS-Panel öffnen und `requirements/ortbeton_p41.ids` hineinziehen.
3. Die Validierung starten.
4. **Kontrolle:** geprüfte Wände **[eintragen]**, bestanden **[eintragen]**, durchgefallen **[eintragen]**.
5. Eine durchgefallene Wand anklicken. IFClite zoomt auf das Bauteil und markiert es rot. Diese Wände sind die ersten Befunde für den Modellautor.

Details zum IDS-Panel: [IFClite-Dokumentation, IDS Validation](https://louistrue.github.io/ifc-lite/guide/ids)

### Schritt 2 · Datenlage im Colab-Notebook verstehen

[![In Colab öffnen](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Shyvanos/bxmid03-hs26-team-3/blob/main/checks/Team3_Ortbeton_NPK_Starter.ipynb)

1. Auf den Badge klicken. Das Notebook [`checks/Team3_Ortbeton_NPK_Starter.ipynb`](checks/Team3_Ortbeton_NPK_Starter.ipynb) öffnet sich in Google Colab.
2. Im Menü **Laufzeit → Alle ausführen** wählen (englisch: *Runtime → Run all*).
3. Die Zelle «2 · Modell laden» fragt nach der Datei. Das Arbeitsmodell hochladen.
   **Obacht:** Nur hochladen, wenn ein Upload auf Google-Server für euer Modell erlaubt ist. Sonst das Notebook lokal in VS Code oder Jupyter öffnen und `MODELL` auf den lokalen Pfad setzen.
4. Was ihr seht:

   | Abschnitt im Notebook | Ergebnis |
   |---|---|
   | 3 · Wandtabelle | eine Zeile pro `IfcWall` mit Betontyp, Material, Höhe, Dicke, NetVolume, NetSideArea, Betonieretappe |
   | 4 · Scope | welche Wände in den Mengenauszug gehören (Vorschlag: nur Ortbeton, kein Bestand) |
   | 5 · Datenprüfung | Anzahl Wände ohne Betontyp, ohne Höhe, mit NetVolume fehlend oder ≤ 0, mit Höhe über 4.0 m |
   | 6 bis 8 · Zuordnung, Status, Summen | Gerüst. Die Zuordnungstabelle enthält nur eine Beispielzeile, die ihr ersetzt. |
   | 9 · Export | `ortbeton_pro_wand.csv`, `ortbeton_summen.csv`, `ortbeton_befunde.csv` |

5. **Kontrolle:** Anzahl Wände **[eintragen]**, im Scope **[eintragen]**. Die drei CSV-Dateien nach [`results/`](results/) legen.

### Schritt 3 · Mengenauszug mit dem IFClite-Skript v0.2

1. In [ifclite.com](https://www.ifclite.com) das Arbeitsmodell geöffnet lassen oder neu laden.
2. **Analyze → Script Editor → Import script file** klicken und [`checks/ortbeton_npk.js`](checks/ortbeton_npk.js) wählen.
3. Oben im Skript die Annahmen prüfen (Begründung siehe [Annahmen](#annahmen)):
   ```js
   const BEWEHRUNGSGEHALT_KG_PRO_M3 = 100   // ANNAHME, mit Tragwerksplaner klären
   const STIRNSEITEN_PRO_WAND = 2           // ANNAHME: beide Wandenden geschalt
   ```
   Darunter steht die Tabelle `ZUORDNUNG`: Betonsorte im Wandnamen → NPK-Position. Die Reihenfolge ist wichtig, spezifische Muster wie `C30/37 WD` stehen vor `C30/37`.
4. **Run** klicken.
5. **Kontrolle** in der Konsole:
   ```
   [Anzahl] Wände geprüft
   Beton:    {"bestanden": …, "fehlend": …, "nicht zugeordnet": …, "ausgeschlossen": …}
   Schalung: {"bestanden": …, "fehlend": …, "ausgeschlossen": …}
   --- LV-Auszug (nur bestandene Mengen) ---
   241.TODO C30/37: … m3
   241.TODO Bewehrung (Schätzung): … kg
   241.TODO Wandschalung: … m2
   241.TODO Stirnschalung: … m2
   ```
   Erwartete Zahlen mit dem Arbeitsmodell: **[eintragen]**.
   Steht dort `ACHTUNG: 0 Wände gefunden`, ist kein Modell geladen. Ein leerer Lauf belegt nichts.
6. Der Browser lädt zwei Dateien herunter. Fragt er nach der Erlaubnis für mehrere Downloads, diese erteilen.

   | Datei | Inhalt |
   |---|---|
   | `waende_v02_detail.csv` | eine Zeile pro Wand: GlobalId, Name, Beton_m3, NPK_Beton, Ergebnis_Beton, Wandschalung_m2, Stirnschalung_m2, Ergebnis_Schalung, Bewehrung_kg_SCHAETZUNG, Regel, Grund |
   | `waende_v02_lv_auszug.csv` | Summe pro NPK-Position mit Einheit, nur bestandene Mengen |

7. Beide Dateien mit Datum im Namen nach [`results/`](results/) kopieren, z. B. `2026-11-03_waende_v02_detail.csv`.

### Schritt 4 · Ergebnis kontrollieren

1. `waende_v02_detail.csv` in Excel öffnen. Das Trennzeichen ist das Semikolon.
2. Nach `Ergebnis_Beton` und `Ergebnis_Schalung` filtern. Alles ausser «bestanden» und «ausgeschlossen» ist ein Befund. Der Grund steht in der Spalte `Grund`.
3. **Obacht:** Die Schalung rechnet das Skript auch für Wände mit Ergebnis_Beton «fehlend», «durchgefallen» oder «nicht zugeordnet». Nur «ausgeschlossen» fällt weg. Beton und Schalung im LV-Auszug können darum aus unterschiedlich vielen Wänden stammen.
4. Eine Wand von Hand nachrechnen und im [Nachweis](#nachweis-handnachrechnung-einer-wand) eintragen.
5. Negativtest: In einer Testkopie des Modells bei einer Wand die Betonsorte aus dem Namen entfernen. Erwartung: Ergebnis_Beton «nicht zugeordnet» mit Grund «Keine NPK-Zuordnung für diese Betonsorte».

#### Nachweis: Handnachrechnung einer Wand

| | Skript | Von Hand (Plan) | Abweichung |
|---|---|---|---|
| GlobalId | **[eintragen]** | | |
| Beton m³ = NetVolume | | | |
| Wandschalung m² = 2 × NetSideArea | | | |
| Stirnschalung m² = 2 × Width × Height | | | |
| Bewehrung kg = Beton × 100 kg/m³ | | | |

### Schritt 5 · Übernahme ins LV und Befunde melden

1. Im Skript die Platzhalter `241.TODO …` durch eure NPK-Positionsnummern ersetzen. Nur Nummer und eigene Kurzbezeichnung, keine NPK-Positionstexte (Lizenz CRB).
2. Das Skript nochmals laufen lassen ([Schritt 3](#schritt-3--mengenauszug-mit-dem-ifclite-skript-v02)) und die Mengen aus `waende_v02_lv_auszug.csv` ins LV übernehmen.
3. Die Bewehrung bleibt eine Schätzung, bis der Bewehrungsgehalt mit dem Tragwerksplaner geklärt ist.
4. Wände mit «fehlend», «durchgefallen» oder «nicht zugeordnet» mit GlobalId und Grund an den Modellautor melden.

## Mengenregeln v0.2

Regel im Skript: `v0.2 03.11.2026: NetVolume > 0 und Betonsorte zugeordnet, Schalung aus NetSideArea, Width, Height`

| Menge | Formel | Einheit | NPK-Position (Platzhalter) | Herkunft |
|---|---|---|---|---|
| Beton | `Qto_WallBaseQuantities.NetVolume` | m³ | `241.TODO C30/37 WD`, `241.TODO C30/37` | Modell |
| Wandschalung | 2 × `NetSideArea` (beide Seiten) | m² | `241.TODO Wandschalung` | Modell |
| Stirnschalung | 2 × `Width` × `Height` (beide Wandenden) | m² | `241.TODO Stirnschalung` | Modell und Annahme |
| Bewehrung | Beton × 100 kg/m³ | kg | `241.TODO Bewehrung (Schätzung)` | **Annahme**, nicht aus dem Modell |

**Ergebnis_Beton**

| Ergebnis | Bedingung |
|---|---|
| bestanden | NetVolume > 0 und Betonsorte im Namen ist zugeordnet |
| fehlend | NetVolume fehlt |
| durchgefallen | NetVolume ≤ 0 |
| nicht zugeordnet | keine Zeile in `ZUORDNUNG` passt zum Namen |
| ausgeschlossen | Name enthält «Bestand», wird nicht neu betoniert |

**Ergebnis_Schalung**

| Ergebnis | Bedingung |
|---|---|
| bestanden | NetSideArea, Height und Width vorhanden |
| fehlend | NetSideArea, Height oder Width fehlt |
| ausgeschlossen | Wand ist bei Beton ausgeschlossen |

## Annahmen

Das Skript verlangt, dass das Team jede Annahme festlegt und hier begründet.

| Annahme | Wert im Skript | Begründung | Status |
|---|---|---|---|
| Bewehrungsgehalt | 100 kg/m³ | **[eintragen]** | mit Tragwerksplaner klären |
| Stirnseiten pro Wand | 2, beide Wandenden frei | **[eintragen]** | offen |
| Zuordnung Betonsorte → NPK | `C30/37 WD`, `C30/37` | **[eintragen]** | NPK-Nummern offen (`241.TODO`) |
| Bestandswände | ausgeschlossen | wird nicht neu betoniert | gemäss Skript |

## Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| Konsole zeigt `ACHTUNG: 0 Wände gefunden` | Modell in IFClite geladen? Enthält es `IfcWall`? |
| Nur eine CSV-Datei heruntergeladen | Der Browser hat den zweiten Download blockiert. Mehrere Downloads für die Seite erlauben und nochmals **Run** klicken. |
| Viele Wände «nicht zugeordnet» | Die Betonsorte im Wandnamen fehlt in `ZUORDNUNG`. Zeile ergänzen, spezifische Muster zuerst. |
| Viele Wände «fehlend» bei der Schalung | `Qto_WallBaseQuantities` mit NetSideArea, Width oder Height fehlt im Export. Befund an den Modellautor. |
| Umlaute in Excel falsch dargestellt | In Excel über **Daten → Aus Text/CSV** importieren und als Dateiursprung UTF-8 wählen. |
| Colab: `Modell nicht gefunden` | Zelle «2 · Modell laden» nochmals ausführen und die Datei hochladen, oder `MODELL` auf den lokalen Pfad setzen. |
| Colab: `No module named ifcopenshell` | Zelle «1 · Pakete installieren» nochmals ausführen. |

## Ordner

| Ordner | Inhalt |
|---|---|
| [`checks/`](checks/) | [`ortbeton_npk.js`](checks/ortbeton_npk.js): Prüfskript v0.2 für IFClite (Beton, Schalung, Bewehrung) · [`Team3_Ortbeton_NPK_Starter.ipynb`](checks/Team3_Ortbeton_NPK_Starter.ipynb): Notebook für Colab (Scope, Datenprüfung, Summen) |
| [`checks/archiv/`](checks/archiv/) | [`ortbeton_npk_v01.js`](checks/archiv/ortbeton_npk_v01.js): abgelöster Stand v0.1 vom 27.10.2026, nur Beton in m³ |
| [`requirements/`](requirements/) | [`ortbeton_p41.ids`](requirements/ortbeton_p41.ids): IDS für die Eingangsprüfung, v0.1 vom 27.10.2026 |
| [`results/`](results/) | CSV-Ausgaben der Läufe ([Übersicht](results/README.md)) |

Das Arbeitsmodell liegt nicht im Repository.

## Stand

- **v0.1 (27.10.2026):** Beton in m³ pro NPK-Position. Archiviert in [`checks/archiv/`](checks/archiv/).
- **v0.2 (03.11.2026):** zusätzlich Wandschalung, Stirnschalung und Bewehrung (Schätzung). Zwei CSV-Dateien: Detail pro Wand und LV-Auszug.
- **Offen:**
  - NPK-Positionsnummern statt `241.TODO`
  - Bewehrungsgehalt mit dem Tragwerksplaner klären
  - Die Zuordnung `C25/30` aus v0.1 fehlt in v0.2. Wände mit dieser Betonsorte erscheinen als «nicht zugeordnet».
  - Das IDS prüft noch nicht `NetSideArea`, `Width` und `Height`, die v0.2 für die Schalung braucht.
  - Notebook (Betontyp aus `wg_SUB` × Höhe) und Skript (Betonsorte im Wandnamen) ordnen noch nach unterschiedlicher Logik zu.
  - Erwartete Zahlen und Handnachrechnung eintragen
