// ═══════════════════════════════════════════════════════════════
//  CHASHFLOW — Google Apps Script (backend)
//  Reemplazá SHEET_ID con el ID de tu hoja
// ═══════════════════════════════════════════════════════════════

const SHEET_ID   = 'TU_SHEET_ID_AQUI'  // <-- no tocar, ya lo tenés configurado
const SHEET_NAME = 'Movimientos'
const SHEET_NAME_SERVICIOS = 'Servicios'

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
}

function getServiciosSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID)
  let sheet = ss.getSheetByName(SHEET_NAME_SERVICIOS)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SERVICIOS)
    sheet.appendRow(['id', 'nombre', 'monto', 'vencimiento', 'recurrente', 'activo', 'ultimoAvisoPara'])
  }
  // Forzamos texto plano en "vencimiento" y "ultimoAvisoPara" para que Sheets no las
  // auto-convierta a fecha (eso rompía la lectura y mostraba "NaN días" en la app).
  sheet.getRange('D2:D').setNumberFormat('@')
  sheet.getRange('G2:G').setNumberFormat('@')
  return sheet
}

// Convierte cualquier valor de la columna vencimiento (string ISO, o un objeto Date si
// Sheets llegó a auto-convertirlo antes de este fix) a un string 'yyyy-MM-dd' prolijo.
function normalizarFecha(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  return String(v).slice(0, 10)
}

function doGet(e) {
  try {
    const action = e.parameter && e.parameter.action

    if (action === 'getServicios') {
      const sheet = getServiciosSheet()
      const rows  = sheet.getDataRange().getValues()
      if (rows.length <= 1) return json({ ok: true, data: [] })
      const headers = rows[0]
      const data = rows.slice(1).map(row => {
        const obj = {}
        headers.forEach((h, i) => obj[h] = row[i])
        obj.monto = Number(obj.monto)
        obj.vencimiento = normalizarFecha(obj.vencimiento)
        obj.recurrente = obj.recurrente === true || obj.recurrente === 'TRUE'
        obj.activo = obj.activo === true || obj.activo === 'TRUE'
        return obj
      })
      return json({ ok: true, data })
    }

    if (action === 'getServiciosConfig') {
      return json({ ok: true, data: getServiciosConfig() })
    }

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

    if (payload.action === 'update') {
      const sheet = getSheet()
      const rows  = sheet.getDataRange().getValues()
      const r = payload.row
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(r.id)) {
          sheet.getRange(i + 1, 1, 1, 6).setValues([[r.id, r.fecha, r.tipo, r.cat, Number(r.importe), r.desc || '']])
          return json({ ok: true })
        }
      }
      return json({ ok: false, error: 'Fila no encontrada' })
    }

    if (payload.action === 'getPresupuestos') {
      return json({ ok: true, data: getPresupuestos() })
    }

    if (payload.action === 'setPresupuestos') {
      setPresupuestos(payload.presupuestos || {})
      return json({ ok: true })
    }

    if (payload.action === 'addServicio') {
      const r = payload.row
      const sheet = getServiciosSheet()
      const row = sheet.getLastRow() + 1
      // Fijamos formato texto ANTES de escribir: si se escribe primero y se formatea
      // después, Sheets ya convirtió el string a fecha y no hay forma de revertirlo.
      sheet.getRange(row, 4).setNumberFormat('@')
      sheet.getRange(row, 7).setNumberFormat('@')
      sheet.getRange(row, 1, 1, 7).setValues([[r.id, r.nombre, Number(r.monto), r.vencimiento, !!r.recurrente, true, '']])
      return json({ ok: true })
    }

    if (payload.action === 'updateServicio') {
      const sheet = getServiciosSheet()
      const rows  = sheet.getDataRange().getValues()
      const r = payload.row
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(r.id)) {
          sheet.getRange(i + 1, 4).setNumberFormat('@')
          sheet.getRange(i + 1, 1, 1, 6).setValues([[r.id, r.nombre, Number(r.monto), r.vencimiento, !!r.recurrente, r.activo !== false]])
          return json({ ok: true })
        }
      }
      return json({ ok: false, error: 'Servicio no encontrado' })
    }

    if (payload.action === 'deleteServicio') {
      const sheet = getServiciosSheet()
      const rows  = sheet.getDataRange().getValues()
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(payload.id)) {
          sheet.deleteRow(i + 1)
          return json({ ok: true })
        }
      }
      return json({ ok: false, error: 'Servicio no encontrado' })
    }

    if (payload.action === 'setServiciosConfig') {
      setServiciosConfig(payload.config || {})
      return json({ ok: true })
    }

    if (payload.action === 'avisarAhora') {
      const resultado = revisarVencimientos(true)
      return json({ ok: true, enviados: resultado.enviados, candidatos: resultado.candidatos })
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

// ── Presupuestos por categoría ──
// Se guardan como JSON en las Propiedades del Script (no requiere tocar la hoja).
function getPresupuestos() {
  const raw = PropertiesService.getScriptProperties().getProperty('PRESUPUESTOS')
  return raw ? JSON.parse(raw) : {}
}

function setPresupuestos(obj) {
  PropertiesService.getScriptProperties().setProperty('PRESUPUESTOS', JSON.stringify(obj))
}

// ── Servicios: config de notificación (teléfono, apikey CallMeBot, días de aviso) ──
function getServiciosConfig() {
  const raw = PropertiesService.getScriptProperties().getProperty('SERVICIOS_CONFIG')
  return raw ? JSON.parse(raw) : { telefono: '', apikey: '', diasAviso: 3 }
}

function setServiciosConfig(cfg) {
  const actual = getServiciosConfig()
  const nuevo = {
    telefono:  cfg.telefono  !== undefined ? String(cfg.telefono)  : actual.telefono,
    apikey:    cfg.apikey    !== undefined ? String(cfg.apikey)    : actual.apikey,
    diasAviso: cfg.diasAviso !== undefined ? Number(cfg.diasAviso) : actual.diasAviso,
  }
  PropertiesService.getScriptProperties().setProperty('SERVICIOS_CONFIG', JSON.stringify(nuevo))
}

// Envía un mensaje de WhatsApp usando CallMeBot (gratuito, solo al número registrado con el apikey).
// Guía rápida: agregá el contacto +34 644 59 71 67 en tu WhatsApp, mandale "I allow callmebot to
// add me" y te va a responder con tu apikey. Cargá ese teléfono y apikey en el módulo Servicios.
function enviarWhatsApp(telefono, apikey, texto) {
  if (!telefono || !apikey) return false
  const url = 'https://api.callmebot.com/whatsapp.php'
    + '?phone=' + encodeURIComponent(telefono)
    + '&text=' + encodeURIComponent(texto)
    + '&apikey=' + encodeURIComponent(apikey)
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
    return res.getResponseCode() === 200
  } catch (err) {
    return false
  }
}

// Revisa todos los servicios activos y avisa por WhatsApp los que vencen dentro de
// `diasAviso` días. Si un servicio recurrente ya venció, lo empuja un mes hacia adelante.
// forzar=true (botón "Avisar ahora") ignora si ya se avisó y reenvía igual.
function revisarVencimientos(forzar) {
  const cfg = getServiciosConfig()
  const sheet = getServiciosSheet()
  const rows  = sheet.getDataRange().getValues()
  if (rows.length <= 1) return { enviados: 0, candidatos: 0 }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  let enviados = 0
  let candidatos = 0

  for (let i = 1; i < rows.length; i++) {
    const [id, nombre, monto, vencimientoRaw, recurrente, activo, ultimoAvisoPara] = rows[i]
    if (activo === false || activo === 'FALSE') continue

    let vencimiento = new Date(vencimientoRaw)
    vencimiento.setHours(0, 0, 0, 0)

    // Si ya venció y es recurrente, lo empujamos al mes siguiente y limpiamos el aviso.
    if (vencimiento < hoy && (recurrente === true || recurrente === 'TRUE')) {
      const nuevaFecha = new Date(vencimiento)
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1)
      vencimiento = nuevaFecha
      const fechaStr = Utilities.formatDate(vencimiento, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      sheet.getRange(i + 1, 4).setNumberFormat('@').setValue(fechaStr)
      sheet.getRange(i + 1, 7).setNumberFormat('@').setValue('')
    }

    const diffDias = Math.round((vencimiento - hoy) / 86400000)
    const fechaVenc = Utilities.formatDate(vencimiento, Session.getScriptTimeZone(), 'yyyy-MM-dd')
    const yaAvisado = String(ultimoAvisoPara) === fechaVenc

    if (diffDias >= 0 && diffDias <= (cfg.diasAviso || 3) && (forzar || !yaAvisado)) {
      candidatos++
      const texto = diffDias === 0
        ? `🔔 Chashflow: hoy vence "${nombre}" ($${monto}).`
        : `🔔 Chashflow: "${nombre}" ($${monto}) vence en ${diffDias} día(s), el ${fechaVenc}.`
      const ok = enviarWhatsApp(cfg.telefono, cfg.apikey, texto)
      if (ok) {
        sheet.getRange(i + 1, 7).setNumberFormat('@').setValue(fechaVenc)
        enviados++
      }
    }
  }
  return { enviados, candidatos }
}

// Ejecutar UNA VEZ manualmente desde el editor de Apps Script (▶ Ejecutar) para instalar
// el chequeo automático diario. No hace falta volver a correrla después.
function crearTriggerDiario() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'revisarVencimientosTrigger') ScriptApp.deleteTrigger(t)
  })
  ScriptApp.newTrigger('revisarVencimientosTrigger')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create()
}

function revisarVencimientosTrigger() {
  revisarVencimientos(false)
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
