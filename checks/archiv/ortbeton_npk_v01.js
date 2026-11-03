// Team 3 · Ortbeton nach NPK · Regel v0.1 (27.10.2026)
// Läuft im IFC-Lite Script Editor (ifclite.com → Analyze → Script Editor)
// Modell: Team_3_WaltGalmarini_Arbeitsmodell.ifc (IFC4, Volumen in m³)
//
// Regel: Jede Wand hat Qto_WallBaseQuantities.NetVolume > 0 m³ und eine
//        Betonsorte im Namen, die einer NPK-Position zugeordnet ist.
// Status: bestanden | durchgefallen (NetVolume <= 0) | fehlend (NetVolume fehlt)
//         | nicht zugeordnet (keine Zuordnungsregel) | ausgeschlossen (Bestand)

// ---- Zuordnung Betonsorte -> NPK (vom Team festzulegen und zu begründen) ----
const ZUORDNUNG = [
  { muster: /Bestand/i,          npk: '',                status: 'ausgeschlossen', grund: 'Bestandswand, wird nicht neu betoniert' },
  { muster: /Beton C30\/37/i,    npk: '241.TODO C30/37', status: 'bestanden',      grund: '' },
  { muster: /Beton C25\/30/i,    npk: '241.TODO C25/30', status: 'bestanden',      grund: '' },
]
const REGEL = 'NetVolume > 0 m3 und Betonsorte zugeordnet · v0.1 27.10.2026'

const walls = bim.query.byType('IfcWall', 'IfcWallStandardCase')
const rows = [['GlobalId', 'Name', 'NetVolume_m3', 'NPK_Position', 'Regel', 'Ergebnis', 'Grund']]
const zaehler = {}
const summe = {}

for (const w of walls) {
  const vol = bim.query.quantity(w, 'Qto_WallBaseQuantities', 'NetVolume')
  const name = w.Name || ''
  const treffer = ZUORDNUNG.find(r => r.muster.test(name))
  let res, grund, npk = ''

  if (treffer && treffer.status === 'ausgeschlossen') {
    res = 'ausgeschlossen'; grund = treffer.grund
  } else if (vol == null) {
    res = 'fehlend'; grund = 'Qto_WallBaseQuantities.NetVolume fehlt'
  } else if (!(vol > 0)) {
    res = 'durchgefallen'; grund = 'NetVolume muss grösser als 0 m3 sein'
  } else if (!treffer) {
    res = 'nicht zugeordnet'; grund = 'Keine NPK-Zuordnung für diese Betonsorte'
  } else {
    res = 'bestanden'; grund = ''; npk = treffer.npk
    summe[npk] = (summe[npk] || 0) + vol
  }
  zaehler[res] = (zaehler[res] || 0) + 1
  const ist = vol == null ? '' : vol.toFixed(3)
  rows.push([w.GlobalId, name, ist, npk, REGEL, res, grund])
}

console.log(walls.length + ' Wände geprüft')
for (const k of ['bestanden', 'durchgefallen', 'fehlend', 'nicht zugeordnet', 'ausgeschlossen']) {
  console.log(k + ': ' + (zaehler[k] || 0))
}
for (const k in summe) console.log('Summe ' + k + ': ' + summe[k].toFixed(3) + ' m3')

if (walls.length === 0) console.log('ACHTUNG: 0 Wände gefunden – ein leerer Lauf belegt nichts')

// Semikolon als Trennzeichen, damit Excel (CH) die Datei direkt öffnet
bim.export.download(rows.map(r => r.join(';')).join('\n'), 'ortbeton_npk_lauf.csv', 'text/csv')
