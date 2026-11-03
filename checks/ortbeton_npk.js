// Team 3 · Ortbeton nach NPK · Wände komplett · Regel v0.2 (03.11.2026)
// Läuft im IFC-Lite Script Editor (ifclite.com → Analyze → Script Editor)
// Modell: Team_3_WaltGalmarini_Arbeitsmodell.ifc (IFC4, Längen in m, Flächen in m², Volumen in m³)
//
// Mengen pro Wand:
//   Beton        = Qto_WallBaseQuantities.NetVolume                      [m³]
//   Wandschalung = 2 × Qto_WallBaseQuantities.NetSideArea (beide Seiten)  [m²]
//   Stirnschalung= 2 × Width × Height (beide Wandenden)                   [m²]  ANNAHME: beide Enden frei
//   Bewehrung    = Beton × BEWEHRUNGSGEHALT                               [kg]  SCHÄTZUNG, nicht aus dem Modell
//
// Zwei Ergebnisse pro Wand:
//   Ergebnis_Beton:    bestanden | fehlend | durchgefallen | nicht zugeordnet | ausgeschlossen
//   Ergebnis_Schalung: bestanden | fehlend (NetSideArea, Height oder Width fehlt) | ausgeschlossen

// ---- ANNAHMEN (vom Team festzulegen und im README zu begründen) ----
const BEWEHRUNGSGEHALT_KG_PRO_M3 = 100   // ANNAHME, mit Tragwerksplaner klären
const STIRNSEITEN_PRO_WAND = 2           // ANNAHME: beide Wandenden geschalt

// ---- Zuordnung Betonsorte -> NPK (Reihenfolge wichtig: spezifische Muster zuerst) ----
const ZUORDNUNG = [
  { muster: /Bestand/i,             npk: '',                   status: 'ausgeschlossen', grund: 'Bestandswand, wird nicht neu betoniert' },
  { muster: /Beton C30\/37 WD/i,    npk: '241.TODO C30/37 WD', status: 'bestanden',      grund: '' },
  { muster: /Beton C30\/37/i,       npk: '241.TODO C30/37',    status: 'bestanden',      grund: '' },
]
const NPK_WANDSCHALUNG  = '241.TODO Wandschalung'
const NPK_STIRNSCHALUNG = '241.TODO Stirnschalung'
const NPK_BEWEHRUNG     = '241.TODO Bewehrung (Schätzung)'
const REGEL = 'v0.2 03.11.2026: NetVolume > 0 und Betonsorte zugeordnet, Schalung aus NetSideArea, Width, Height'

const QSET = 'Qto_WallBaseQuantities'
const walls = bim.query.byType('IfcWall', 'IfcWallStandardCase')
const rows = [['GlobalId', 'Name', 'Beton_m3', 'NPK_Beton', 'Ergebnis_Beton', 'Wandschalung_m2', 'Stirnschalung_m2',
               'Ergebnis_Schalung', 'Bewehrung_kg_SCHAETZUNG', 'Regel', 'Grund']]
const zBeton = {}, zSchal = {}
const lv = {}   // NPK-Position -> { menge, einheit }
const add = (pos, menge, einheit) => { lv[pos] = lv[pos] || { menge: 0, einheit }; lv[pos].menge += menge }
const fmt = (x, n) => (x == null ? '' : x.toFixed(n))

for (const w of walls) {
  const name = w.Name || ''
  const vol = bim.query.quantity(w, QSET, 'NetVolume')
  const seite = bim.query.quantity(w, QSET, 'NetSideArea')
  const dicke = bim.query.quantity(w, QSET, 'Width')
  const hoehe = bim.query.quantity(w, QSET, 'Height')
  const treffer = ZUORDNUNG.find(r => r.muster.test(name))
  const gruende = []
  let resB, resS, npk = '', wandS = null, stirnS = null, bew = null

  // --- Beton ---
  if (treffer && treffer.status === 'ausgeschlossen') {
    resB = 'ausgeschlossen'; gruende.push(treffer.grund)
  } else if (vol == null) {
    resB = 'fehlend'; gruende.push('NetVolume fehlt')
  } else if (!(vol > 0)) {
    resB = 'durchgefallen'; gruende.push('NetVolume muss grösser als 0 m3 sein')
  } else if (!treffer) {
    resB = 'nicht zugeordnet'; gruende.push('Keine NPK-Zuordnung für diese Betonsorte')
  } else {
    resB = 'bestanden'; npk = treffer.npk
    bew = vol * BEWEHRUNGSGEHALT_KG_PRO_M3
    add(npk, vol, 'm3')
    add(NPK_BEWEHRUNG, bew, 'kg')
  }

  // --- Schalung ---
  if (resB === 'ausgeschlossen') {
    resS = 'ausgeschlossen'
  } else {
    const fehlt = []
    if (seite == null) fehlt.push('NetSideArea')
    if (hoehe == null) fehlt.push('Height')
    if (dicke == null) fehlt.push('Width')
    if (fehlt.length > 0) {
      resS = 'fehlend'; gruende.push('Für Schalung fehlt: ' + fehlt.join(', '))
    } else {
      resS = 'bestanden'
      wandS = 2 * seite
      stirnS = STIRNSEITEN_PRO_WAND * dicke * hoehe
      add(NPK_WANDSCHALUNG, wandS, 'm2')
      add(NPK_STIRNSCHALUNG, stirnS, 'm2')
    }
  }

  zBeton[resB] = (zBeton[resB] || 0) + 1
  zSchal[resS] = (zSchal[resS] || 0) + 1
  rows.push([w.GlobalId, name, fmt(vol, 3), npk, resB, fmt(wandS, 2), fmt(stirnS, 2), resS, fmt(bew, 0), REGEL, gruende.join(' | ')])
}

console.log(walls.length + ' Wände geprüft')
if (walls.length === 0) console.log('ACHTUNG: 0 Wände gefunden – ein leerer Lauf belegt nichts')
console.log('Beton:    ' + JSON.stringify(zBeton))
console.log('Schalung: ' + JSON.stringify(zSchal))
console.log('--- LV-Auszug (nur bestandene Mengen) ---')
const lvRows = [['NPK_Position', 'Menge', 'Einheit']]
for (const pos in lv) {
  console.log(pos + ': ' + lv[pos].menge.toFixed(lv[pos].einheit === 'kg' ? 0 : 2) + ' ' + lv[pos].einheit)
  lvRows.push([pos, lv[pos].menge.toFixed(lv[pos].einheit === 'kg' ? 0 : 2), lv[pos].einheit])
}

// Zwei Dateien: Detail pro Wand und LV-Auszug (Browser fragt evtl. nach Erlaubnis für mehrere Downloads)
bim.export.download(rows.map(r => r.join(';')).join('\n'), 'waende_v02_detail.csv', 'text/csv')
bim.export.download(lvRows.map(r => r.join(';')).join('\n'), 'waende_v02_lv_auszug.csv', 'text/csv')
