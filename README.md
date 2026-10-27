# Readme Ortbeton nach NPK | Gruppe 3



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

