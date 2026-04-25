// ═══════════════════════════════════════════════════════════════
//  MIS FINANZAS — Google Apps Script (backend)
//  1. Abrí tu Google Sheet
//  2. Extensiones → Apps Script → pegá este código
//  3. Reemplazá SHEET_ID con el ID de tu hoja
//  4. Implementar → Nueva implementación → Aplicación web
//     · Ejecutar como: Yo
//     · Acceso: Cualquier usuario
//  5. Copiá la URL generada y pegala en la app (sección Config)
// ═══════════════════════════════════════════════════════════════

const SHEET_ID   = 'TU_SHEET_ID_AQUI'
const SHEET_NAME = 'Movimientos'

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
}

// GET → devuelve todos los movimientos como JSON
function doGet(e) {
  try {
    const sheet = getSheet()
    const rows  = sheet.getDataRange().getValues()
    if (rows.length <= 1) return json({ ok: true, data: [] })
    const headers = rows[0]
    const data = rows.slice(1).map(row => {
      const obj = {}
      headers.forEach((h, i) => obj[h] = row[i])
      obj.importe = Number(obj.importe)
      return obj
    })
    return json({ ok: true, data })
  } catch (err) {
    return json({ ok: false, error: err.message })
  }
}

// POST → agregar o eliminar un movimiento
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents)

    if (payload.action === 'add') {
      const r = payload.row
      getSheet().appendRow([r.id, r.fecha, r.tipo, r.cat, Number(r.importe), r.desc || ''])
      return json({ ok: true })
    }

    if (payload.action === 'delete') {
      const sheet = getSheet()
      const rows  = sheet.getDataRange().getValues()
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(payload.id)) {
          sheet.deleteRow(i + 1)
          return json({ ok: true })
        }
      }
      return json({ ok: false, error: 'Fila no encontrada' })
    }

    return json({ ok: false, error: 'Acción desconocida' })
  } catch (err) {
    return json({ ok: false, error: err.message })
  }
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
