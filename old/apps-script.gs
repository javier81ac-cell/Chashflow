// ═══════════════════════════════════════════════════════════════
//  CHASHFLOW — Google Apps Script (backend)
//  Reemplazá SHEET_ID con el ID de tu hoja
// ═══════════════════════════════════════════════════════════════

const SHEET_ID   = 'TU_SHEET_ID_AQUI'  // <-- no tocar, ya lo tenés configurado
const SHEET_NAME = 'Movimientos'

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
}

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

    if (payload.action === 'scan') {
      return scanTicket(payload.imageBase64, payload.mediaType)
    }

    return json({ ok: false, error: 'Acción desconocida' })
  } catch (err) {
    return json({ ok: false, error: err.message })
  }
}

function scanTicket(imageBase64, mediaType) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY')
  if (!apiKey) return json({ ok: false, error: 'API key no configurada' })

  const prompt = `Analizá esta imagen de un ticket, factura o resumen de tarjeta de crédito.
Extraé la información y respondé ÚNICAMENTE con un objeto JSON con este formato exacto, sin texto adicional:
{
  "fecha": "YYYY-MM-DD",
  "importe": 1234.56,
  "descripcion": "nombre del comercio o concepto",
  "categoria": "una de estas opciones exactas: Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Ropa, Servicios, Otros gastos",
  "tipo": "gasto"
}

Reglas:
- La fecha debe estar en formato YYYY-MM-DD. Si no se ve claramente, usá la fecha de hoy.
- El importe debe ser un número sin símbolos ni puntos de miles, solo con punto decimal si tiene centavos.
- Para la categoría elegí la más apropiada según el comercio o concepto.
- Si es un resumen de tarjeta con múltiples gastos, tomá el total a pagar.
- Respondé SOLO el JSON, sin explicaciones ni markdown.`

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    payload: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType || 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    }),
    muteHttpExceptions: true
  })

  const result = JSON.parse(response.getContentText())

  if (result.error) {
    return json({ ok: false, error: result.error.message })
  }

  try {
    const texto = result.content[0].text.trim()
    const datos = JSON.parse(texto)
    return json({ ok: true, datos })
  } catch (err) {
    return json({ ok: false, error: 'No se pudo interpretar la respuesta de Claude' })
  }
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
